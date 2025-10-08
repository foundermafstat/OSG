'use client';

import React, { use, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as PIXI from 'pixi.js';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../../../env.config';

interface PageProps {
	params: Promise<{ gameType: string }>;
}

export default function TestGamePage({ params }: PageProps) {
	const resolvedParams = use(params);
	const searchParams = useSearchParams();
	const pixiContainer = useRef<HTMLDivElement>(null);
	const appRef = useRef<PIXI.Application | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [roomId, setRoomId] = useState('');
	const [players, setPlayers] = useState<any[]>([]);

	useEffect(() => {
		const id =
			searchParams.get('roomId') ||
			'test-' + Math.random().toString(36).substring(7);
		setRoomId(id);
		console.log('[TestGame] Room ID set:', id);
	}, [searchParams]);

	useEffect(() => {
		if (!roomId || appRef.current) {
			console.log('[TestGame] Skip init:', {
				roomId,
				hasApp: !!appRef.current,
			});
			return;
		}

		const init = async () => {
			console.log('[TestGame] Initializing with:', {
				gameType: resolvedParams.gameType,
				roomId,
			});

			// Wait for layout
			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));

			if (!pixiContainer.current) {
				console.error('[TestGame] Container not found!');
				return;
			}

			// Calculate dimensions
			const headerHeight = 60;
			const width = window.innerWidth;
			const height = window.innerHeight - headerHeight;

			console.log(`[TestGame] Creating canvas: ${width}x${height}`);

			// Create Pixi app
			const app = new PIXI.Application();
			await app.init({
				width,
				height,
				backgroundColor:
					resolvedParams.gameType === 'shooter' ? 0x0a0a0a : 0x2c3e50,
				antialias: true,
			});

			// Style canvas
			app.canvas.style.display = 'block';
			app.canvas.style.width = `${width}px`;
			app.canvas.style.height = `${height}px`;
			app.canvas.style.position = 'absolute';
			app.canvas.style.top = '0';
			app.canvas.style.left = '0';

			// Add to DOM
			if (pixiContainer.current) {
				pixiContainer.current.appendChild(app.canvas);
				console.log('[TestGame] Canvas added to DOM');
			}

			appRef.current = app;

			// Create game world
			const gameContainer = new PIXI.Container();
			app.stage.addChild(gameContainer);

			// Add game title
			const titleText = new PIXI.Text(
				`${resolvedParams.gameType.toUpperCase()} GAME\nRoom: ${roomId}`,
				{
					fontFamily: 'Arial',
					fontSize: 24,
					fill: 0xffffff,
					align: 'center',
				}
			);
			titleText.anchor.set(0.5);
			titleText.x = width / 2;
			titleText.y = 50;
			gameContainer.addChild(titleText);

			// Add spawn markers (like in real game)
			const spawnPoints = [
				{ x: 200, y: 200 },
				{ x: width - 200, y: 200 },
				{ x: width / 2, y: height - 200 },
			];

			spawnPoints.forEach((spawn, index) => {
				const marker = new PIXI.Graphics();
				marker.circle(spawn.x, spawn.y, 20);
				marker.stroke({ width: 2, color: 0xff4444, alpha: 0.5 });
				marker.circle(spawn.x, spawn.y, 30);
				marker.stroke({ width: 1, color: 0xff4444, alpha: 0.3 });

				const text = new PIXI.Text(`Spawn ${index + 1}`, {
					fontFamily: 'Arial',
					fontSize: 12,
					fill: 0xff4444,
				});
				text.anchor.set(0.5);
				text.x = spawn.x;
				text.y = spawn.y - 50;

				gameContainer.addChild(marker);
				gameContainer.addChild(text);
			});

			// Connect to socket
			console.log('[TestGame] Connecting to socket...');
			const socket = io(
				`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`,
				{
					transports: ['websocket', 'polling'],
				}
			);

			socket.on('connect', () => {
				console.log('[TestGame] Socket connected!');
				setIsConnected(true);
				socket.emit('createRoom', {
					gameType: resolvedParams.gameType,
					roomId,
					config: { worldWidth: width, worldHeight: height },
				});
			});

			socket.on('roomCreated', (data: any) => {
				console.log('[TestGame] Room created:', data);
				socket.emit('screenDimensions', { width, height });
			});

			socket.on('gameState', (state: any) => {
				if (state.players) {
					setPlayers(state.players);

					// Draw players
					state.players.forEach((player: any) => {
						// Simple player visualization
						const existingPlayer = gameContainer.children.find(
							(child: any) => child.name === `player-${player.id}`
						);

						if (!existingPlayer && player.alive) {
							const playerGraphic = new PIXI.Graphics();
							playerGraphic.name = `player-${player.id}`;

							const color = parseInt(
								player.color.startsWith('#')
									? player.color.substring(1)
									: player.color,
								16
							);

							playerGraphic.circle(player.x, player.y, 15);
							playerGraphic.fill(color);

							const nameText = new PIXI.Text(player.name, {
								fontFamily: 'Arial',
								fontSize: 10,
								fill: 0xffffff,
							});
							nameText.anchor.set(0.5);
							nameText.x = player.x;
							nameText.y = player.y - 25;

							gameContainer.addChild(playerGraphic);
							gameContainer.addChild(nameText);
						}
					});
				}
			});

			socket.on('playerConnected', (player: any) => {
				console.log('[TestGame] Player connected:', player.name);
			});

			socketRef.current = socket;
			console.log('[TestGame] Initialization complete!');
		};

		init();

		return () => {
			console.log('[TestGame] Cleanup');
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
		};
	}, [roomId, resolvedParams.gameType]);

	if (!roomId) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading...</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 w-full h-full bg-gray-900 flex flex-col">
			{/* Header */}
			<div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
				<div>
					<h1 className="text-white text-2xl font-bold">
						Test {resolvedParams.gameType}
					</h1>
					<p className="text-gray-400 text-sm">Room: {roomId}</p>
				</div>
				<div className="flex items-center space-x-4">
					<div className="text-sm">
						<span className="text-gray-400">Socket: </span>
						<span className={isConnected ? 'text-green-400' : 'text-red-400'}>
							{isConnected ? 'Connected' : 'Disconnected'}
						</span>
					</div>
					<div className="text-sm text-gray-400">Players: {players.length}</div>
					<a
						href="/"
						className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
					>
						Home
					</a>
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
		</div>
	);
}
