'use client';

import React, { use, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as PIXI from 'pixi.js';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../../../env.config';
import {
	ArrowLeft,
	Users,
	Zap,
	Flag,
	QrCode,
	X,
	Wifi,
	WifiOff,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const GameScreen = dynamic(() => import('@/components/GameScreen'), {
	ssr: false,
	loading: () => (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center">
			<div className="text-white text-xl">Loading game...</div>
		</div>
	),
});

const MobileController = dynamic(
	() => import('@/components/MobileController'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading controller...</div>
			</div>
		),
	}
);

const RaceGameScreen = dynamic(() => import('@/components/RaceGameScreen'), {
	ssr: false,
	loading: () => (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center">
			<div className="text-white text-xl">Loading race...</div>
		</div>
	),
});

const RaceMobileController = dynamic(
	() => import('@/components/RaceMobileController'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading controller...</div>
			</div>
		),
	}
);

const TowerDefenceGameScreen = dynamic(
	() => import('@/components/TowerDefenceGameScreen'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading tower defence...</div>
			</div>
		),
	}
);

const TowerDefenceMobileController = dynamic(
	() => import('@/components/TowerDefenceMobileController'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading controller...</div>
			</div>
		),
	}
);

// Dynamic import only for QR code component (non-critical)
const QRCodeDisplay = dynamic(
	() => import('../../../components/QRCodeDisplay'),
	{
		ssr: false,
	}
);

interface PageProps {
	params: Promise<{ gameType: string }>;
}

interface Player {
	id: string;
	name: string;
	x: number;
	y: number;
	alive: boolean;
	color: string;
	kills?: number;
	deaths?: number;
	lap?: number;
	angle?: number;
	speed?: number;
	effects?: {
		speedBoost?: { active: boolean; endTime: number };
		shield?: { active: boolean; endTime: number };
	};
	facingDirection?: { x: number; y: number };
	aimDirection?: { x: number; y: number };
	isMoving?: boolean;
}

interface GameState {
	players?: Player[];
	bullets?: any[];
	bots?: any[];
	obstacles?: any[];
	interactiveObjects?: any[];
	checkpoints?: any[];
	// Tower Defence specific
	towers?: any[];
	mobs?: any[];
	projectiles?: any[];
	path?: any[];
	buildSpots?: any[];
	castle?: any;
	wave?: number;
	money?: number;
	isWaveActive?: boolean;
	nextWaveIn?: number;
	gameOver?: boolean;
}

export default function GamePage({ params }: PageProps) {
	const resolvedParams = use(params);
	const searchParams = useSearchParams();
	const pixiContainer = useRef<HTMLDivElement>(null);
	const appRef = useRef<PIXI.Application | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const gameContainerRef = useRef<PIXI.Container | null>(null);
	const playersMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const bulletsMapRef = useRef<Map<string, PIXI.Graphics>>(new Map());
	const botsMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const obstaclesRef = useRef<PIXI.Graphics[]>([]);
	const checkpointsRef = useRef<PIXI.Graphics[]>([]);
	const interactiveObjectsRef = useRef<Map<string, PIXI.Container>>(new Map());

	// Tower Defence specific refs
	const towersMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const mobsMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const projectilesMapRef = useRef<Map<string, PIXI.Graphics>>(new Map());
	const buildSpotsRef = useRef<PIXI.Graphics[]>([]);
	const pathGraphicRef = useRef<PIXI.Graphics | null>(null);
	const castleGraphicRef = useRef<PIXI.Container | null>(null);

	const [currentView, setCurrentView] = useState<'game' | 'controller'>('game');
	const [roomId, setRoomId] = useState<string>('');
	const [isInitialized, setIsInitialized] = useState(false);
	const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
	const [gameStats, setGameStats] = useState({
		totalKills: 0,
		activePlayers: 0,
	});
	const [showQRPopup, setShowQRPopup] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');

	// Tower Defence specific state
	const [tdState, setTdState] = useState({
		wave: 0,
		money: 0,
		castleHealth: 100,
		gameOver: false,
		selectedSpot: null as string | null,
	});

	// Initialize room ID from URL
	useEffect(() => {
		const mode = searchParams.get('mode');
		const id =
			searchParams.get('roomId') ||
			'room-' + Math.random().toString(36).substring(7);

		console.log('[GamePage] URL params:', {
			mode,
			roomId: id,
			gameType: resolvedParams.gameType,
		});

			setRoomId(id);
			if (mode === 'controller') {
				setCurrentView('controller');
			}
		setIsInitialized(true);
	}, [searchParams, resolvedParams.gameType]);

	// Initialize Pixi.js and Socket
	useEffect(() => {
		if (!isInitialized || !roomId || currentView !== 'game' || appRef.current) {
			console.log('[GamePage] Skip init:', {
				isInitialized,
				roomId,
				currentView,
				hasApp: !!appRef.current,
			});
			return;
		}

		const init = async () => {
			console.log('[GamePage] Starting game initialization...');

			// Wait for layout
			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));

			if (!pixiContainer.current) {
				console.error('[GamePage] Container not found!');
				return;
			}

			// Calculate dimensions
			const headerHeight = 50;
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight - headerHeight;

			console.log(`[GamePage] Canvas size: ${screenWidth}x${screenHeight}`);

			// Create Pixi app
			const app = new PIXI.Application();
			await app.init({
				width: screenWidth,
				height: screenHeight,
				backgroundColor:
					resolvedParams.gameType === 'shooter'
						? 0x0a0a0a
						: resolvedParams.gameType === 'race'
						? 0x2c3e50
						: resolvedParams.gameType === 'towerdefence'
						? 0x1a2332
						: 0x0a0a0a,
				antialias: true,
			});

			// Style canvas
			app.canvas.style.display = 'block';
			app.canvas.style.width = `${screenWidth}px`;
			app.canvas.style.height = `${screenHeight}px`;
			app.canvas.style.position = 'absolute';
			app.canvas.style.top = '0';
			app.canvas.style.left = '0';

			// Add to DOM
			if (pixiContainer.current) {
				pixiContainer.current.appendChild(app.canvas);
				console.log(
					'[GamePage] Canvas added, bounds:',
					app.canvas.getBoundingClientRect()
				);
			}

			appRef.current = app;

			// Create game container
			const gameContainer = new PIXI.Container();
			app.stage.addChild(gameContainer);
			gameContainerRef.current = gameContainer;

			// Add spawn markers for shooter
			if (resolvedParams.gameType === 'shooter') {
				const spawnPoints = [
					{ x: 200, y: 200 },
					{ x: screenWidth - 200, y: 200 },
					{ x: screenWidth / 2, y: screenHeight - 200 },
				];

				spawnPoints.forEach((spawn) => {
					const marker = new PIXI.Graphics();
					marker.circle(spawn.x, spawn.y, 20);
					marker.stroke({ width: 2, color: 0xff4444, alpha: 0.5 });
					marker.circle(spawn.x, spawn.y, 30);
					marker.stroke({ width: 1, color: 0xff4444, alpha: 0.3 });
					gameContainer.addChild(marker);
				});
			}

			// Connect to socket
			console.log('[GamePage] Connecting to socket...');
			const socket = io(
				`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`,
				{
					transports: ['websocket', 'polling'],
					timeout: 5000,
					reconnection: true,
				}
			);

			socket.on('connect', () => {
				console.log('[GamePage] Socket connected!');
				setConnectionStatus('connected');
				socket.emit('createRoom', {
					gameType: resolvedParams.gameType,
					roomId,
					config: {
						worldWidth: screenWidth,
						worldHeight: screenHeight,
						trackWidth: screenWidth,
						trackHeight: screenHeight,
					},
				});
			});

			socket.on('roomCreated', (data: any) => {
				console.log('[GamePage] Room created:', data);
				socket.emit('screenDimensions', {
					width: screenWidth,
					height: screenHeight,
				});
			});

			socket.on('disconnect', () => {
				console.log('[GamePage] Disconnected');
				setConnectionStatus('disconnected');
			});

			socket.on('connect_error', (error: any) => {
				console.error('[GamePage] Connection error:', error);
				setConnectionStatus('disconnected');
			});

			// Game state handler
			socket.on('gameState', (state: GameState) => {
				if (!gameContainerRef.current) return;

				// Update players
				if (state.players) {
					updatePlayers(state.players, gameContainerRef.current);
					setConnectedPlayers(state.players);

					const totalKills = state.players.reduce(
						(sum, p) => sum + (p.kills || 0),
						0
					);
					const activePlayers = state.players.filter((p) => p.alive).length;
					setGameStats({ totalKills, activePlayers });
				}

				// Update game-specific objects
				if (resolvedParams.gameType === 'shooter') {
					if (state.bullets)
						updateBullets(state.bullets, gameContainerRef.current);
					if (state.bots) updateBots(state.bots, gameContainerRef.current);
					if (state.obstacles)
						updateObstacles(state.obstacles, gameContainerRef.current);
					if (state.interactiveObjects)
						updateInteractiveObjects(
							state.interactiveObjects,
							gameContainerRef.current
						);
				} else if (resolvedParams.gameType === 'race') {
					if (state.checkpoints)
						updateCheckpoints(state.checkpoints, gameContainerRef.current);
					if (state.obstacles)
						updateRaceObstacles(state.obstacles, gameContainerRef.current);
				} else if (resolvedParams.gameType === 'towerdefence') {
					// Tower Defence is handled by separate component
					// This shouldn't be reached as TD uses TowerDefenceGameScreen
				}
			});

			socket.on('playerConnected', (player: Player) => {
				console.log('[GamePage] Player connected:', player.name);
			});

			socket.on('playerDisconnected', (playerId: string) => {
				console.log('[GamePage] Player disconnected:', playerId);
				removePlayer(playerId);
			});

			socketRef.current = socket;
			console.log('[GamePage] Initialization complete!');
		};

		init();

		return () => {
			console.log('[GamePage] Cleanup');
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
			gameContainerRef.current = null;
			playersMapRef.current.clear();
			bulletsMapRef.current.clear();
			botsMapRef.current.clear();
			obstaclesRef.current = [];
			checkpointsRef.current = [];
			interactiveObjectsRef.current.clear();
		};
	}, [isInitialized, roomId, currentView, resolvedParams.gameType]);

	// Update functions
	const updatePlayers = (players: Player[], container: PIXI.Container) => {
		// Remove disconnected players
		for (const [playerId, playerContainer] of playersMapRef.current) {
			if (!players.find((p) => p.id === playerId)) {
				container.removeChild(playerContainer);
				playersMapRef.current.delete(playerId);
			}
		}

		// Update or create players
		players.forEach((player) => {
			let playerContainer = playersMapRef.current.get(player.id);

			if (!playerContainer) {
				playerContainer = new PIXI.Container();
				playersMapRef.current.set(player.id, playerContainer);
				container.addChild(playerContainer);
			}

			playerContainer.removeChildren();

			if (!player.alive) {
				// Dead player
				const ghost = new PIXI.Graphics();
				ghost.circle(15, 15, 15);
				ghost.fill({ color: 0x666666, alpha: 0.3 });
				playerContainer.addChild(ghost);
			} else {
				const color = parseInt(
					player.color.startsWith('#')
						? player.color.substring(1)
						: player.color,
					16
				);

				if (resolvedParams.gameType === 'shooter') {
					// Shooter player
					const playerGraphic = new PIXI.Graphics();
					playerGraphic.circle(15, 15, 15);
					playerGraphic.fill(color);
					playerGraphic.circle(15, 15, 15);
					playerGraphic.stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
					playerContainer.addChild(playerGraphic);
				} else {
					// Race car
					const car = new PIXI.Graphics();
					car.rect(-15, -7.5, 30, 15);
					car.fill(color);
					car.rect(-15, -7.5, 30, 15);
					car.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
					if (player.angle !== undefined) {
						car.rotation = player.angle;
					}
					playerContainer.addChild(car);
				}

				// Player name
				const nameText = new PIXI.Text(player.name, {
					fontFamily: 'Arial',
					fontSize: 10,
					fill: 0xffffff,
				});
				nameText.anchor.set(0.5);
				nameText.x = 15;
				nameText.y = -20;
				playerContainer.addChild(nameText);
			}

			playerContainer.x = player.x;
			playerContainer.y = player.y;
		});
	};

	const updateBullets = (bullets: any[], container: PIXI.Container) => {
		// Remove old bullets
		for (const [bulletId, bulletGraphic] of bulletsMapRef.current) {
			if (!bullets.find((b) => b.id === bulletId)) {
				container.removeChild(bulletGraphic);
				bulletsMapRef.current.delete(bulletId);
			}
		}

		// Create/update bullets
		bullets.forEach((bullet) => {
			let bulletGraphic = bulletsMapRef.current.get(bullet.id);
			if (!bulletGraphic) {
				bulletGraphic = new PIXI.Graphics();
				bulletGraphic.circle(0, 0, 4);
				bulletGraphic.fill(0xffff00);
				bulletsMapRef.current.set(bullet.id, bulletGraphic);
				container.addChild(bulletGraphic);
			}
			bulletGraphic.x = bullet.x;
			bulletGraphic.y = bullet.y;
		});
	};

	const updateBots = (bots: any[], container: PIXI.Container) => {
		// Remove dead bots
		for (const [botId, botContainer] of botsMapRef.current) {
			if (!bots.find((b) => b.id === botId && b.alive)) {
				container.removeChild(botContainer);
				botsMapRef.current.delete(botId);
			}
		}

		// Create/update bots
		bots.forEach((bot) => {
			if (!bot.alive) return;

			let botContainer = botsMapRef.current.get(bot.id);
			if (!botContainer) {
				botContainer = new PIXI.Container();
				botsMapRef.current.set(bot.id, botContainer);
				container.addChild(botContainer);
			}

			botContainer.removeChildren();

			const color = parseInt(bot.color.substring(1), 16);
			const botGraphic = new PIXI.Graphics();
			botGraphic.circle(bot.size / 2, bot.size / 2, bot.size / 2);
			botGraphic.fill({ color, alpha: 0.8 });
			botContainer.addChild(botGraphic);

			botContainer.x = bot.x;
			botContainer.y = bot.y;
		});
	};

	const updateObstacles = (obstacles: any[], container: PIXI.Container) => {
		if (obstaclesRef.current.length === 0 && obstacles.length > 0) {
			obstacles.forEach((obstacle) => {
				const obstacleGraphic = new PIXI.Graphics();
				obstacleGraphic.rect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);
				obstacleGraphic.fill(0x333333);
				obstacleGraphic.rect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);
				obstacleGraphic.stroke({ width: 2, color: 0x555555 });
				obstaclesRef.current.push(obstacleGraphic);
				container.addChild(obstacleGraphic);
			});
		}
	};

	const updateInteractiveObjects = (
		objects: any[],
		container: PIXI.Container
	) => {
		objects.forEach((obj) => {
			let objContainer = interactiveObjectsRef.current.get(obj.id);

			if (!objContainer) {
				objContainer = new PIXI.Container();
				interactiveObjectsRef.current.set(obj.id, objContainer);
				container.addChild(objContainer);
			}

			objContainer.removeChildren();

			const graphic = new PIXI.Graphics();

			switch (obj.type) {
				case 'teleporter':
					graphic.circle(obj.width / 2, obj.height / 2, obj.width / 2);
					graphic.fill({ color: 0x9b59b6, alpha: 0.8 });
					break;
				case 'speedBoost':
					if (obj.active) {
						graphic.poly([
							obj.width / 2,
							0,
							obj.width,
							obj.height / 2,
							obj.width / 2,
							obj.height,
							0,
							obj.height / 2,
						]);
						graphic.fill({ color: 0xf39c12, alpha: 0.8 });
					}
					break;
				case 'shield':
					if (obj.active) {
						graphic.rect(0, 0, obj.width, obj.height);
						graphic.fill({ color: 0x3498db, alpha: 0.8 });
					}
					break;
				case 'bouncer':
					graphic.circle(obj.width / 2, obj.height / 2, obj.width / 2);
					graphic.fill({ color: 0xe74c3c, alpha: 0.8 });
					break;
			}

			objContainer.addChild(graphic);
			objContainer.x = obj.x;
			objContainer.y = obj.y;
		});
	};

	const updateCheckpoints = (checkpoints: any[], container: PIXI.Container) => {
		if (checkpointsRef.current.length === 0 && checkpoints.length > 0) {
			checkpoints.forEach((checkpoint, index) => {
				const cpGraphic = new PIXI.Graphics();
				cpGraphic.rect(
					checkpoint.x,
					checkpoint.y,
					checkpoint.width,
					checkpoint.height
				);
				cpGraphic.fill({ color: 0xffff00, alpha: 0.1 });
				cpGraphic.rect(
					checkpoint.x,
					checkpoint.y,
					checkpoint.width,
					checkpoint.height
				);
				cpGraphic.stroke({ width: 3, color: 0xffff00, alpha: 0.6 });

				const cpText = new PIXI.Text(`CP ${index + 1}`, {
					fontFamily: 'Arial',
					fontSize: 14,
					fill: 0xffff00,
					fontWeight: 'bold',
				});
				cpText.anchor.set(0.5);
				cpText.x = checkpoint.x + checkpoint.width / 2;
				cpText.y = checkpoint.y + checkpoint.height / 2;

				checkpointsRef.current.push(cpGraphic);
				container.addChild(cpGraphic);
				container.addChild(cpText);
			});
		}
	};

	const updateRaceObstacles = (obstacles: any[], container: PIXI.Container) => {
		if (obstaclesRef.current.length === 0 && obstacles.length > 0) {
			obstacles.forEach((obstacle) => {
				const obstacleGraphic = new PIXI.Graphics();
				obstacleGraphic.rect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);
				obstacleGraphic.fill(0xe74c3c);
				obstacleGraphic.rect(
					obstacle.x,
					obstacle.y,
					obstacle.width,
					obstacle.height
				);
				obstacleGraphic.stroke({ width: 2, color: 0xc0392b });
				obstaclesRef.current.push(obstacleGraphic);
				container.addChild(obstacleGraphic);
			});
		}
	};

	const removePlayer = (playerId: string) => {
		const playerContainer = playersMapRef.current.get(playerId);
		if (playerContainer && gameContainerRef.current) {
			gameContainerRef.current.removeChild(playerContainer);
			playersMapRef.current.delete(playerId);
		}
	};

	// Controller view (redirect to controller component)
	if (currentView === 'controller') {
		// Load controller dynamically based on game type
		if (resolvedParams.gameType === 'towerdefence') {
	return (
				<TowerDefenceMobileController
					gameId={roomId}
					gameType={resolvedParams.gameType}
				/>
			);
		}

		const ControllerComponent =
			resolvedParams.gameType === 'race'
				? RaceMobileController
				: MobileController;

		return (
			<ControllerComponent gameId={roomId} gameType={resolvedParams.gameType} />
		);
	}

	// Use separate component for Tower Defence
	if (resolvedParams.gameType === 'towerdefence' && currentView === 'game') {
		return (
			<TowerDefenceGameScreen
					gameId={roomId}
					gameType={resolvedParams.gameType}
					onBack={() => (window.location.href = '/')}
				/>
		);
	}

	// Loading state
	if (!isInitialized || !roomId) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading...</div>
			</div>
		);
	}

	const controllerUrl = `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.CLIENT_PORT}/game/${resolvedParams.gameType}?mode=controller&roomId=${roomId}`;
	const sortedPlayers = [...connectedPlayers].sort(
		(a, b) => (b.lap || 0) - (a.lap || 0)
	);

	return (
		<div className="fixed inset-0 w-full h-full bg-gray-900 flex flex-col overflow-hidden">
			{/* Header */}
			<div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0 z-10">
				<button
					onClick={() => (window.location.href = '/')}
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
						<span>{gameStats.activePlayers}</span>
					</div>
					{resolvedParams.gameType === 'shooter' && (
						<div className="flex items-center space-x-1 text-yellow-400">
							<Zap className="w-4 h-4" />
							<span>{gameStats.totalKills}</span>
						</div>
					)}
					<button
						onClick={() => setShowQRPopup(true)}
						className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
					>
						<QrCode className="w-4 h-4" />
						<span>Connect</span>
					</button>
				</div>
			</div>

			{/* Canvas Container */}
			<div className="flex-1 relative bg-gray-900" style={{ minHeight: 0 }}>
				<div
					ref={pixiContainer}
					className="absolute inset-0"
					style={{ width: '100%', height: '100%' }}
				/>
			</div>

			{/* QR Code Popup */}
			{showQRPopup && QRCodeDisplay && (
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
									{resolvedParams.gameType === 'race' && (
										<Flag className="w-5 h-5 mr-2" />
									)}
									{resolvedParams.gameType === 'race'
										? 'Leaderboard'
										: `Players (${connectedPlayers.length})`}
								</h3>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{(resolvedParams.gameType === 'race'
										? sortedPlayers
										: connectedPlayers
									).map((player, index) => (
										<div
											key={player.id}
											className={`flex items-center justify-between p-2 rounded-lg ${
												player.alive
													? 'bg-green-900/20 border border-green-700/50'
													: 'bg-red-900/20 border border-red-700/50'
											}`}
										>
											<div className="flex items-center space-x-2">
												{resolvedParams.gameType === 'race' && (
													<span className="text-white font-bold w-6">
														{index + 1}.
													</span>
												)}
												<div
													className="w-3 h-3 rounded-full"
													style={{ backgroundColor: player.color }}
												/>
												<span className="text-white text-sm font-medium">
													{player.name}
												</span>
											</div>
											{resolvedParams.gameType === 'race' ? (
												<div className="text-xs text-yellow-400">
													Lap {player.lap || 0}
												</div>
											) : (
												<div className="text-xs text-gray-400">
													{player.kills || 0}K/{player.deaths || 0}D
												</div>
											)}
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
}
