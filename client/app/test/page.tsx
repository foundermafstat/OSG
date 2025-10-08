'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../../env.config';

export default function TestPage() {
	const pixiContainer = useRef<HTMLDivElement>(null);
	const appRef = useRef<PIXI.Application | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const [gameState, setGameState] = useState<any>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [roomId] = useState(
		'test-room-' + Math.random().toString(36).substring(7)
	);

	useEffect(() => {
		if (appRef.current) {
			console.log('[Test] App already exists');
			return;
		}

		const init = async () => {
			console.log('[Test] Starting initialization...');

			// Wait for layout
			await new Promise((resolve) => requestAnimationFrame(resolve));
			await new Promise((resolve) => requestAnimationFrame(resolve));

			if (!pixiContainer.current) {
				console.error('[Test] Container not found!');
				return;
			}

			// Calculate dimensions
			const headerHeight = 60;
			const width = window.innerWidth;
			const height = window.innerHeight - headerHeight;

			console.log(`[Test] Creating canvas: ${width}x${height}`);

			// Create Pixi app
			const app = new PIXI.Application();
			await app.init({
				width,
				height,
				backgroundColor: 0x1a1a2e,
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
				console.log('[Test] Canvas added to DOM');
			}

			appRef.current = app;

			// Create test graphics
			const graphics = new PIXI.Graphics();

			// Background grid
			graphics.setStrokeStyle({ width: 1, color: 0x444444, alpha: 0.3 });
			for (let x = 0; x < width; x += 50) {
				graphics.moveTo(x, 0);
				graphics.lineTo(x, height);
				graphics.stroke();
			}
			for (let y = 0; y < height; y += 50) {
				graphics.moveTo(0, y);
				graphics.lineTo(width, y);
				graphics.stroke();
			}

			app.stage.addChild(graphics);

			// Add center circle
			const circle = new PIXI.Graphics();
			circle.circle(width / 2, height / 2, 50);
			circle.fill(0x00ff00);
			app.stage.addChild(circle);

			// Add text
			const text = new PIXI.Text('Test Canvas', {
				fontFamily: 'Arial',
				fontSize: 32,
				fill: 0xffffff,
			});
			text.anchor.set(0.5);
			text.x = width / 2;
			text.y = height / 2 - 100;
			app.stage.addChild(text);

			// Animate circle
			let elapsed = 0;
			app.ticker.add((delta) => {
				elapsed += delta.deltaTime * 0.02;
				circle.scale.set(1 + Math.sin(elapsed) * 0.2);
			});

			// Connect to socket
			console.log('[Test] Connecting to socket...');
			const socket = io(
				`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`,
				{
					transports: ['websocket', 'polling'],
				}
			);

			socket.on('connect', () => {
				console.log('[Test] Socket connected!');
				setIsConnected(true);
				socket.emit('createRoom', {
					gameType: 'shooter',
					roomId,
					config: { worldWidth: width, worldHeight: height },
				});
			});

			socket.on('roomCreated', (data: any) => {
				console.log('[Test] Room created:', data);
			});

			socket.on('gameState', (state: any) => {
				setGameState(state);
			});

			socketRef.current = socket;

			console.log('[Test] Initialization complete!');
		};

		init();

		return () => {
			console.log('[Test] Cleanup');
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
		};
	}, [roomId]);

	return (
		<div className="fixed inset-0 w-full h-full bg-gray-900 flex flex-col">
			{/* Header */}
			<div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
				<div>
					<h1 className="text-white text-2xl font-bold">Test Page</h1>
					<p className="text-gray-400 text-sm">Room: {roomId}</p>
				</div>
				<div className="flex items-center space-x-4">
					<div className="text-sm">
						<span className="text-gray-400">Socket: </span>
						<span className={isConnected ? 'text-green-400' : 'text-red-400'}>
							{isConnected ? 'Connected' : 'Disconnected'}
						</span>
					</div>
					{gameState && (
						<div className="text-sm text-gray-400">
							Players: {gameState.players?.length || 0}
						</div>
					)}
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
