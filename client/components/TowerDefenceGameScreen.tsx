'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../env.config';
import {
	ArrowLeft,
	Users,
	Heart,
	Coins,
	Waves as WavesIcon,
	X,
	Wifi,
	WifiOff,
	QrCode,
	Play,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const QRCodeDisplay = dynamic(() => import('./QRCodeDisplay'), { ssr: false });

interface TowerDefenceGameScreenProps {
	gameId: string;
	gameType: string;
	onBack: () => void;
}

export default function TowerDefenceGameScreen({
	gameId,
	gameType,
	onBack,
}: TowerDefenceGameScreenProps) {
	const pixiContainer = useRef<HTMLDivElement>(null);
	const appRef = useRef<PIXI.Application | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const gameContainerRef = useRef<PIXI.Container | null>(null);

	const towersMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const mobsMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const projectilesMapRef = useRef<Map<string, PIXI.Graphics>>(new Map());
	const buildSpotsMapRef = useRef<Map<string, PIXI.Container>>(new Map());
	const pathGraphicRef = useRef<PIXI.Graphics | null>(null);
	const castleGraphicRef = useRef<PIXI.Container | null>(null);

	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');
	const [showQRPopup, setShowQRPopup] = useState(false);
	const [gameState, setGameState] = useState<any>(null);
	const [selectedSpot, setSelectedSpot] = useState<string | null>(null);

	useEffect(() => {
		if (appRef.current) return;

		const init = async () => {
			console.log('[TowerDefence] Initializing...');

			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));

			if (!pixiContainer.current) return;

			const headerHeight = 50;
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight - headerHeight;

			const app = new PIXI.Application();
			await app.init({
				width: screenWidth,
				height: screenHeight,
				backgroundColor: 0x1a2332,
				antialias: true,
			});

			app.canvas.style.display = 'block';
			app.canvas.style.width = `${screenWidth}px`;
			app.canvas.style.height = `${screenHeight}px`;
			app.canvas.style.position = 'absolute';
			app.canvas.style.top = '0';
			app.canvas.style.left = '0';

			if (pixiContainer.current) {
				pixiContainer.current.appendChild(app.canvas);
			}

			appRef.current = app;

			const gameContainer = new PIXI.Container();
			app.stage.addChild(gameContainer);
			gameContainerRef.current = gameContainer;

			// Connect socket
			const socket = io(
				`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`,
				{
					transports: ['websocket', 'polling'],
				}
			);

			socket.on('connect', () => {
				console.log('[TowerDefence] Connected');
				setConnectionStatus('connected');
				socket.emit('createRoom', {
					gameType: 'towerdefence',
					roomId: gameId,
					config: { worldWidth: screenWidth, worldHeight: screenHeight },
				});
			});

			socket.on('roomCreated', (data: any) => {
				console.log('[TowerDefence] Room created:', data);
			});

			socket.on('disconnect', () => setConnectionStatus('disconnected'));

			socket.on('gameState', (state: any) => {
				if (!gameContainerRef.current) return;

				setGameState(state);

				// Draw path (once)
				if (state.path && !pathGraphicRef.current) {
					const pathGraphic = new PIXI.Graphics();
					pathGraphic.moveTo(state.path[0].x, state.path[0].y);
					for (let i = 1; i < state.path.length; i++) {
						pathGraphic.lineTo(state.path[i].x, state.path[i].y);
					}
					pathGraphic.stroke({ width: 40, color: 0x2c3e50, alpha: 0.5 });
					gameContainerRef.current.addChild(pathGraphic);
					pathGraphicRef.current = pathGraphic;
				}

				// Draw build spots (once)
				if (state.buildSpots && buildSpotsMapRef.current.size === 0) {
					state.buildSpots.forEach((spot: any, index: number) => {
						const spotContainer = new PIXI.Container();

						const spotGraphic = new PIXI.Graphics();
						spotGraphic.circle(0, 0, 25);
						if (spot.occupied) {
							spotGraphic.fill({ color: 0x555555, alpha: 0.3 });
						} else {
							spotGraphic.fill({ color: 0x00ff00, alpha: 0.2 });
							spotGraphic.circle(0, 0, 25);
							spotGraphic.stroke({ width: 2, color: 0x00ff00, alpha: 0.5 });
						}

						spotContainer.addChild(spotGraphic);

						// Add spot number
						const spotNumber = new PIXI.Text(`${index + 1}`, {
							fontFamily: 'Arial',
							fontSize: 16,
							fill: spot.occupied ? 0x999999 : 0x00ff00,
							fontWeight: 'bold',
						});
						spotNumber.anchor.set(0.5);
						spotContainer.addChild(spotNumber);

						spotContainer.x = spot.x;
						spotContainer.y = spot.y;
						spotContainer.eventMode = 'static';
						spotContainer.cursor = 'pointer';

						// Click handler
						spotContainer.on('pointerdown', () => {
							if (!spot.occupied) {
								setSelectedSpot(spot.id);
							}
						});

						gameContainerRef.current!.addChild(spotContainer);
						buildSpotsMapRef.current.set(spot.id, spotContainer);
					});
				}

				// Draw castle
				if (state.castle && !castleGraphicRef.current) {
					const castle = new PIXI.Container();

					const castleGraphic = new PIXI.Graphics();
					castleGraphic.rect(-30, -30, 60, 60);
					castleGraphic.fill(0x8b4513);
					castleGraphic.rect(-30, -30, 60, 60);
					castleGraphic.stroke({ width: 3, color: 0x654321 });

					// Tower tops
					for (let i = 0; i < 2; i++) {
						for (let j = 0; j < 2; j++) {
							const x = -20 + i * 40;
							const y = -40 + j * 50;
							castleGraphic.rect(x - 5, y, 10, 15);
							castleGraphic.fill(0x654321);
						}
					}

					castle.addChild(castleGraphic);

					const flag = new PIXI.Graphics();
					flag.poly([0, -50, 0, -70, 15, -65, 0, -60]);
					flag.fill(0xff0000);
					castle.addChild(flag);

					castle.x = state.castle.x;
					castle.y = state.castle.y;

					gameContainerRef.current!.addChild(castle);
					castleGraphicRef.current = castle;
				}

				// Update towers
				if (state.towers) {
					updateTowers(state.towers, gameContainerRef.current!);
				}

				// Update mobs
				if (state.mobs) {
					updateMobs(state.mobs, gameContainerRef.current!);
				}

				// Update projectiles
				if (state.projectiles) {
					updateProjectiles(state.projectiles, gameContainerRef.current!);
				}
			});

			socketRef.current = socket;
		};

		init();

		return () => {
			if (socketRef.current) socketRef.current.disconnect();
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
		};
	}, [gameId]);

	const updateTowers = (towers: any[], container: PIXI.Container) => {
		// Remove old towers
		for (const [id, towerContainer] of towersMapRef.current) {
			if (!towers.find((t) => t.id === id)) {
				container.removeChild(towerContainer);
				towersMapRef.current.delete(id);
			}
		}

		// Update or create towers
		towers.forEach((tower) => {
			let towerContainer = towersMapRef.current.get(tower.id);

			if (!towerContainer) {
				towerContainer = new PIXI.Container();
				towersMapRef.current.set(tower.id, towerContainer);
				container.addChild(towerContainer);
			}

			towerContainer.removeChildren();

			// Tower base
			const base = new PIXI.Graphics();
			base.rect(-15, -15, 30, 30);

			const colors: any = {
				basic: 0x808080,
				rapid: 0xffd700,
				sniper: 0x4169e1,
				splash: 0xff4500,
			};
			base.fill(colors[tower.type] || 0x808080);
			base.rect(-15, -15, 30, 30);
			base.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
			towerContainer.addChild(base);

			// Range indicator (optional, when selected)
			const range = new PIXI.Graphics();
			range.circle(0, 0, tower.range);
			range.stroke({ width: 1, color: 0x00ff00, alpha: 0.2 });
			towerContainer.addChild(range);

			// Level indicator
			const levelText = new PIXI.Text(`L${tower.level}`, {
				fontFamily: 'Arial',
				fontSize: 10,
				fill: 0xffffff,
			});
			levelText.anchor.set(0.5);
			levelText.y = 20;
			towerContainer.addChild(levelText);

			towerContainer.x = tower.x;
			towerContainer.y = tower.y;
		});
	};

	const updateMobs = (mobs: any[], container: PIXI.Container) => {
		// Remove dead mobs
		for (const [id, mobContainer] of mobsMapRef.current) {
			if (!mobs.find((m) => m.id === id && m.alive)) {
				container.removeChild(mobContainer);
				mobsMapRef.current.delete(id);
			}
		}

		// Update or create mobs
		mobs.forEach((mob) => {
			if (!mob.alive) return;

			let mobContainer = mobsMapRef.current.get(mob.id);

			if (!mobContainer) {
				mobContainer = new PIXI.Container();
				mobsMapRef.current.set(mob.id, mobContainer);
				container.addChild(mobContainer);
			}

			mobContainer.removeChildren();

			// Mob body
			const body = new PIXI.Graphics();
			body.circle(0, 0, 12);
			const color = parseInt(mob.color.substring(1), 16);
			body.fill(color);
			body.circle(0, 0, 12);
			body.stroke({ width: 2, color: 0x000000 });
			mobContainer.addChild(body);

			// Health bar
			const healthPercent = mob.health / mob.maxHealth;
			const healthBar = new PIXI.Graphics();
			healthBar.rect(-10, -20, 20, 3);
			healthBar.fill(0x333333);
			healthBar.rect(-10, -20, 20 * healthPercent, 3);
			healthBar.fill(
				healthPercent > 0.5
					? 0x00ff00
					: healthPercent > 0.25
					? 0xffff00
					: 0xff0000
			);
			mobContainer.addChild(healthBar);

			mobContainer.x = mob.x;
			mobContainer.y = mob.y;
		});
	};

	const updateProjectiles = (projectiles: any[], container: PIXI.Container) => {
		// Remove old projectiles
		for (const [id, proj] of projectilesMapRef.current) {
			if (!projectiles.find((p) => p.id === id)) {
				container.removeChild(proj);
				projectilesMapRef.current.delete(id);
			}
		}

		// Update or create projectiles
		projectiles.forEach((proj) => {
			let projGraphic = projectilesMapRef.current.get(proj.id);

			if (!projGraphic) {
				projGraphic = new PIXI.Graphics();
				projGraphic.circle(0, 0, 3);
				projGraphic.fill(0xffff00);
				projectilesMapRef.current.set(proj.id, projGraphic);
				container.addChild(projGraphic);
			}

			projGraphic.x = proj.x;
			projGraphic.y = proj.y;
		});
	};

	const buildTower = (type: string) => {
		if (!selectedSpot || !socketRef.current) return;

		socketRef.current.emit('playerInput', {
			action: 'buildTower',
			spotId: selectedSpot,
			towerType: type,
		});

		setSelectedSpot(null);
	};

	const startWave = () => {
		if (!socketRef.current) return;
		socketRef.current.emit('playerInput', { action: 'startWave' });
	};

	const controllerUrl = `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.CLIENT_PORT}/game/towerdefence?mode=controller&roomId=${gameId}`;

	return (
		<div className="fixed inset-0 w-full h-full bg-gray-900 flex flex-col overflow-hidden">
			{/* Header */}
			<div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0 z-10">
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
					</div>

					{gameState && (
						<>
							<div className="flex items-center space-x-1 text-yellow-400">
								<Coins className="w-4 h-4" />
								<span>{gameState.money}</span>
							</div>
							<div className="flex items-center space-x-1 text-red-400">
								<Heart className="w-4 h-4" />
								<span>
									{gameState.castle?.health}/{gameState.castle?.maxHealth}
								</span>
							</div>
							<div className="flex items-center space-x-1 text-blue-400">
								<WavesIcon className="w-4 h-4" />
								<span>Wave {gameState.wave}</span>
							</div>
							<div className="flex items-center space-x-1 text-green-400">
								<Users className="w-4 h-4" />
								<span>{gameState.players?.length || 0}</span>
							</div>
						</>
					)}

					{gameState && !gameState.isWaveActive && !gameState.gameOver && (
						<button
							onClick={startWave}
							className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
						>
							<Play className="w-4 h-4" />
							<span>Start Wave</span>
						</button>
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

			{/* Canvas */}
			<div className="flex-1 relative bg-gray-900" style={{ minHeight: 0 }}>
				<div
					ref={pixiContainer}
					className="absolute inset-0"
					style={{ width: '100%', height: '100%' }}
				/>
			</div>

			{/* Tower Build Menu */}
			{selectedSpot && (
				<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-4 border border-gray-700 z-20">
					<div className="text-white text-sm mb-2">Select Tower Type:</div>
					<div className="flex space-x-2">
						<button
							onClick={() => buildTower('basic')}
							className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
						>
							Basic ($50)
						</button>
						<button
							onClick={() => buildTower('rapid')}
							className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm"
						>
							Rapid ($75)
						</button>
						<button
							onClick={() => buildTower('sniper')}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
						>
							Sniper ($150)
						</button>
						<button
							onClick={() => buildTower('splash')}
							className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm"
						>
							Splash ($100)
						</button>
						<button
							onClick={() => setSelectedSpot(null)}
							className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* QR Code Popup */}
			{showQRPopup && QRCodeDisplay && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white">
								Connect Controllers
							</h2>
							<button
								onClick={() => setShowQRPopup(false)}
								className="text-gray-400 hover:text-white transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>
						<QRCodeDisplay url={controllerUrl} />
					</div>
				</div>
			)}

			{/* Game Over */}
			{gameState?.gameOver && (
				<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 text-center">
						<h2 className="text-3xl font-bold text-red-500 mb-4">Game Over!</h2>
						<p className="text-white text-xl mb-2">
							Survived {gameState.wave} waves
						</p>
						<p className="text-gray-400 mb-6">Your castle has been destroyed</p>
						<button
							onClick={onBack}
							className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
						>
							Return to Menu
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
