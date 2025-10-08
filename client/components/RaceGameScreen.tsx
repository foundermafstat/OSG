'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { io, Socket } from 'socket.io-client';
import QRCodeDisplay from './QRCodeDisplay';
import { ArrowLeft, Users, Flag, QrCode, X, Wifi, WifiOff } from 'lucide-react';
import { ENV_CONFIG } from '../env.config';

interface Player {
	id: string;
	name: string;
	x: number;
	y: number;
	angle: number;
	speed: number;
	color: string;
	lap: number;
	alive: boolean;
}

interface Checkpoint {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Obstacle {
	x: number;
	y: number;
	width: number;
	height: number;
	type: string;
}

interface RaceGameScreenProps {
	gameId: string;
	gameType: string;
	onBack: () => void;
}

const RaceGameScreen: React.FC<RaceGameScreenProps> = ({
	gameId,
	gameType,
	onBack,
}) => {
	console.log('[RaceGameScreen] Rendering with:', { gameId, gameType });
	const pixiContainer = useRef<HTMLDivElement>(null);
	const appRef = useRef<PIXI.Application | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const gameContainerRef = useRef<PIXI.Container | null>(null);
	const playersRef = useRef<Map<string, PIXI.Container>>(new Map());
	const checkpointsRef = useRef<PIXI.Graphics[]>([]);
	const obstaclesRef = useRef<PIXI.Graphics[]>([]);
	const initializingRef = useRef(false);
	const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
	const [showQRPopup, setShowQRPopup] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');

	useEffect(() => {
		if (initializingRef.current) return;
		initializingRef.current = true;

		let socket: Socket | null = null;
		let resizeHandler: (() => void) | null = null;

		const initPixi = async () => {
			try {
				await new Promise((resolve) => requestAnimationFrame(resolve));

				const containerElement = pixiContainer.current;
				if (!containerElement) return;

				let screenWidth = containerElement.clientWidth;
				let screenHeight = containerElement.clientHeight;

				if (screenWidth === 0 || screenHeight === 0) {
					screenWidth = window.innerWidth;
					screenHeight = window.innerHeight;
				}

				const app = new PIXI.Application();
				await app.init({
					width: screenWidth,
					height: screenHeight,
					backgroundColor: 0x2c3e50,
					antialias: true,
				});

				resizeHandler = () => {
					if (pixiContainer.current) {
						const newWidth = pixiContainer.current.clientWidth;
						const newHeight = pixiContainer.current.clientHeight;
						app.renderer.resize(newWidth, newHeight);
					}
				};
				window.addEventListener('resize', resizeHandler);

				if (pixiContainer.current) {
					app.canvas.style.display = 'block';
					app.canvas.style.width = '100%';
					app.canvas.style.height = '100%';
					pixiContainer.current.appendChild(app.canvas);
				}
				appRef.current = app;

				const gameContainer = new PIXI.Container();
				app.stage.addChild(gameContainer);
				gameContainerRef.current = gameContainer;

				// Initialize socket
				socket = io(`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`, {
					transports: ['websocket', 'polling'],
					timeout: 5000,
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
				});
				socketRef.current = socket;

				socket.on('connect', () => {
					console.log('[RaceGameScreen] Socket connected to server');
					setConnectionStatus('connected');

					console.log('[RaceGameScreen] Creating room:', {
						gameType,
						roomId: gameId,
					});
					socket!.emit('createRoom', {
						gameType,
						roomId: gameId,
						config: {
							trackWidth: screenWidth,
							trackHeight: screenHeight,
						},
					});
				});

				socket.on('roomCreated', (data) => {
					console.log('[RaceGameScreen] Room created successfully:', data);
				});

				socket.on('disconnect', (reason) => {
					console.log('Disconnected:', reason);
					setConnectionStatus('disconnected');
				});

				socket.on('connect_error', (error) => {
					console.error('Connection error:', error);
					setConnectionStatus('disconnected');
				});

				socket.on(
					'gameState',
					(state: {
						players: Player[];
						checkpoints: Checkpoint[];
						obstacles: Obstacle[];
					}) => {
						if (!gameContainerRef.current) return;

						if (state.players && Array.isArray(state.players)) {
							updatePlayers(state.players, gameContainerRef.current);
							setConnectedPlayers(state.players);
						}

						if (state.checkpoints && Array.isArray(state.checkpoints)) {
							updateCheckpoints(state.checkpoints, gameContainerRef.current);
						}

						if (state.obstacles && Array.isArray(state.obstacles)) {
							updateObstacles(state.obstacles, gameContainerRef.current);
						}
					}
				);

				socket.on('playerConnected', (player: Player) => {
					console.log(`Player ${player.name} connected`);
				});

				socket.on('playerDisconnected', (playerId: string) => {
					console.log(`Player disconnected: ${playerId}`);
					if (gameContainerRef.current) {
						removePlayer(playerId, gameContainerRef.current);
					}
				});
			} catch (error) {
				console.error('Error initializing:', error);
			}
		};

		initPixi();

		return () => {
			if (socket) socket.disconnect();
			if (resizeHandler) {
				window.removeEventListener('resize', resizeHandler);
			}
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
			gameContainerRef.current = null;
		};
	}, []);

	const updatePlayers = (players: Player[], container: PIXI.Container) => {
		// Remove disconnected players
		for (const [playerId, playerContainer] of playersRef.current) {
			if (!players.find((p) => p.id === playerId)) {
				container.removeChild(playerContainer);
				playersRef.current.delete(playerId);
			}
		}

		// Update or create player graphics
		players.forEach((player) => {
			let playerContainer = playersRef.current.get(player.id);

			if (!playerContainer) {
				playerContainer = new PIXI.Container();
				playersRef.current.set(player.id, playerContainer);
				container.addChild(playerContainer);
			}

			playerContainer.removeChildren();

			// Parse color
			let color: number;
			if (typeof player.color === 'string') {
				color = parseInt(
					player.color.startsWith('#')
						? player.color.substring(1)
						: player.color,
					16
				);
			} else {
				color = player.color;
			}

			// Draw car (rotated rectangle)
			const carGraphic = new PIXI.Graphics();
			carGraphic.beginFill(color);
			carGraphic.drawRect(-15, -7.5, 30, 15);
			carGraphic.endFill();

			// Car border
			carGraphic.lineStyle(2, 0xffffff, 0.8);
			carGraphic.drawRect(-15, -7.5, 30, 15);

			// Windshield
			carGraphic.beginFill(0x333333, 0.7);
			carGraphic.drawRect(5, -5, 8, 10);
			carGraphic.endFill();

			carGraphic.rotation = player.angle;
			playerContainer.addChild(carGraphic);

			// Speed indicator
			const speedText = new PIXI.Text(
				`${Math.round(Math.abs(player.speed))} km/h`,
				{
					fontFamily: 'Arial',
					fontSize: 10,
					fill: 0xffffff,
					align: 'center',
				}
			);
			speedText.anchor.set(0.5);
			speedText.y = -25;
			playerContainer.addChild(speedText);

			// Player name
			const nameText = new PIXI.Text(player.name, {
				fontFamily: 'Arial',
				fontSize: 12,
				fill: 0xffffff,
				align: 'center',
				fontWeight: 'bold',
			});
			nameText.anchor.set(0.5);
			nameText.y = -40;
			playerContainer.addChild(nameText);

			// Lap indicator
			const lapText = new PIXI.Text(`Lap: ${player.lap}`, {
				fontFamily: 'Arial',
				fontSize: 8,
				fill: 0xffff00,
				align: 'center',
			});
			lapText.anchor.set(0.5);
			lapText.y = 25;
			playerContainer.addChild(lapText);

			playerContainer.x = player.x;
			playerContainer.y = player.y;
		});
	};

	const updateCheckpoints = (
		checkpoints: Checkpoint[],
		container: PIXI.Container
	) => {
		if (checkpointsRef.current.length === 0) {
			checkpoints.forEach((checkpoint, index) => {
				const cpGraphic = new PIXI.Graphics();
				cpGraphic.lineStyle(3, 0xffff00, 0.6);
				cpGraphic.beginFill(0xffff00, 0.1);
				cpGraphic.drawRect(
					checkpoint.x,
					checkpoint.y,
					checkpoint.width,
					checkpoint.height
				);
				cpGraphic.endFill();

				// Checkpoint number
				const cpText = new PIXI.Text(`CP ${index + 1}`, {
					fontFamily: 'Arial',
					fontSize: 14,
					fill: 0xffff00,
					fontWeight: 'bold',
				});
				cpText.anchor.set(0.5);
				cpText.x = checkpoint.x + checkpoint.width / 2;
				cpText.y = checkpoint.y + checkpoint.height / 2;

				container.addChild(cpGraphic);
				container.addChild(cpText);
				checkpointsRef.current.push(cpGraphic);
			});
		}
	};

	const updateObstacles = (
		obstacles: Obstacle[],
		container: PIXI.Container
	) => {
		if (obstaclesRef.current.length === 0) {
			obstacles.forEach((obstacle) => {
				const obstacleGraphic = new PIXI.Graphics();
				obstacleGraphic.beginFill(0xe74c3c);
				obstacleGraphic.drawRect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);
				obstacleGraphic.endFill();

				obstacleGraphic.lineStyle(2, 0xc0392b);
				obstacleGraphic.drawRect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);

				obstaclesRef.current.push(obstacleGraphic);
				container.addChild(obstacleGraphic);
			});
		}
	};

	const removePlayer = (playerId: string, container: PIXI.Container) => {
		const playerContainer = playersRef.current.get(playerId);
		if (playerContainer) {
			container.removeChild(playerContainer);
			playersRef.current.delete(playerId);
		}
	};

	const controllerUrl = `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.CLIENT_PORT}/game/${gameType}?mode=controller&roomId=${gameId}`;

	// Sort players by lap and position
	const sortedPlayers = [...connectedPlayers].sort((a, b) => b.lap - a.lap);

	return (
		<div className="w-screen h-screen bg-gray-900 flex flex-col overflow-hidden fixed inset-0">
			<div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0">
				<button
					onClick={onBack}
					className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Exit</span>
				</button>

				<div className="flex items-center space-x-4 text-sm">
					<div className="flex items-center space-x-1">
						{connectionStatus === 'connected' ? (
							<Wifi className="w-4 h-4 text-green-400" />
						) : (
							<WifiOff className="w-4 h-4 text-red-400" />
						)}
						<span
							className={
								connectionStatus === 'connected'
									? 'text-green-400'
									: 'text-red-400'
							}
						>
							{connectionStatus}
						</span>
					</div>
					<div className="flex items-center space-x-1 text-green-400">
						<Users className="w-4 h-4" />
						<span>{connectedPlayers.length}</span>
					</div>
					<button
						onClick={() => setShowQRPopup(true)}
						className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
					>
						<QrCode className="w-4 h-4" />
						<span>Connect</span>
					</button>
				</div>
			</div>

			<div className="flex-1 flex bg-gray-900 overflow-hidden min-h-0">
				<div ref={pixiContainer} className="w-full h-full" />
			</div>

			{showQRPopup && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white">Connect Players</h2>
							<button
								onClick={() => setShowQRPopup(false)}
								className="text-gray-400 hover:text-white transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<QRCodeDisplay url={controllerUrl} />

						{connectedPlayers.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-semibold text-white mb-3 flex items-center">
									<Flag className="w-5 h-5 mr-2" />
									Leaderboard
								</h3>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{sortedPlayers.map((player, index) => (
										<div
											key={player.id}
											className="flex items-center justify-between p-2 rounded-lg bg-gray-700/50"
										>
											<div className="flex items-center space-x-2">
												<span className="text-white font-bold w-6">
													{index + 1}.
												</span>
												<div
													className="w-3 h-3 rounded-full"
													style={{ backgroundColor: player.color }}
												/>
												<span className="text-white text-sm font-medium">
													{player.name}
												</span>
											</div>
											<div className="text-xs text-yellow-400">
												Lap {player.lap}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default RaceGameScreen;
