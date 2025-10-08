'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Gamepad2, Flag, Trophy, Wifi, WifiOff, Gauge } from 'lucide-react';
import { ENV_CONFIG } from '../env.config';

interface RaceMobileControllerProps {
	gameId: string;
	gameType: string;
}

interface PlayerData {
	id: string;
	name: string;
	x: number;
	y: number;
	color: string;
	speed: number;
	lap: number;
}

const RaceMobileController: React.FC<RaceMobileControllerProps> = ({
	gameId,
	gameType,
}) => {
	const [connected, setConnected] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [isJoined, setIsJoined] = useState(false);
	const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');

	const socketRef = useRef<Socket | null>(null);
	const acceleratorRef = useRef<HTMLDivElement>(null);
	const brakeRef = useRef<HTMLDivElement>(null);
	const steeringRef = useRef<HTMLDivElement>(null);
	const steeringKnobRef = useRef<HTMLDivElement>(null);
	const inputStateRef = useRef({ accelerate: 0, turn: 0 });
	const lastInputSentRef = useRef({ accelerate: 0, turn: 0 });
	const isSteeringRef = useRef(false);
	const steeringTouchIdRef = useRef<number | null>(null);

	useEffect(() => {
		const socketUrl = `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`;
		console.log('Connecting to socket server at:', socketUrl);
		const socket = io(socketUrl, {
			transports: ['websocket', 'polling'],
			timeout: 5000,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Connected to server with ID:', socket.id);
			setConnected(true);
			setConnectionStatus('connected');
		});

		socket.on('disconnect', (reason) => {
			console.log('Disconnected from server:', reason);
			setConnected(false);
			setConnectionStatus('disconnected');
			setIsJoined(false);
		});

		socket.on('connect_error', (error) => {
			console.error('Connection error:', error);
			setConnectionStatus('disconnected');
		});

		socket.on('playerJoined', (data) => {
			console.log('Player joined successfully:', data);
			setIsJoined(true);
			if (data.playerData) {
				setPlayerData(data.playerData);
			}
		});

		socket.on('gameState', (state) => {
			const player = state.players.find((p: any) => p.id === socket.id);
			if (player) {
				setPlayerData(player);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	// Send input updates
	useEffect(() => {
		if (!isJoined || !socketRef.current) return;

		const sendInput = () => {
			const currentInput = inputStateRef.current;
			const lastInput = lastInputSentRef.current;

			const threshold = 0.01;
			if (
				Math.abs(currentInput.accelerate - lastInput.accelerate) > threshold ||
				Math.abs(currentInput.turn - lastInput.turn) > threshold
			) {
				socketRef.current?.emit('playerInput', currentInput);
				lastInputSentRef.current = { ...currentInput };
			}
		};

		const interval = setInterval(sendInput, 16); // ~60 FPS
		return () => clearInterval(interval);
	}, [isJoined]);

	const joinGame = () => {
		if (socketRef.current && playerName.trim() && connected) {
			console.log('Attempting to join room with name:', playerName.trim());
			socketRef.current.emit('joinRoom', {
				roomId: gameId,
				playerName: playerName.trim(),
			});
		}
	};

	// Accelerator/Brake handlers
	const handleAcceleratorStart = () => {
		inputStateRef.current.accelerate = 1;
	};

	const handleAcceleratorEnd = () => {
		inputStateRef.current.accelerate = 0;
	};

	const handleBrakeStart = () => {
		inputStateRef.current.accelerate = -1;
	};

	const handleBrakeEnd = () => {
		inputStateRef.current.accelerate = 0;
	};

	// Steering handlers
	const handleSteeringStart = (e: React.TouchEvent | React.MouseEvent) => {
		e.preventDefault();
		if (e.type.startsWith('touch')) {
			const touch = (e as React.TouchEvent).touches[0];
			if (touch) {
				steeringTouchIdRef.current = touch.identifier;
			}
		}
		isSteeringRef.current = true;
	};

	const handleSteeringMove = (
		e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent
	) => {
		if (
			!isSteeringRef.current ||
			!steeringRef.current ||
			!steeringKnobRef.current
		)
			return;

		e.preventDefault();
		const rect = steeringRef.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;

		let clientX;
		if (e.type.startsWith('touch')) {
			const touches =
				(e as TouchEvent).touches || (e as React.TouchEvent).touches;
			let targetTouch = touches[0];

			if (steeringTouchIdRef.current !== null) {
				for (let i = 0; i < touches.length; i++) {
					if (touches[i].identifier === steeringTouchIdRef.current) {
						targetTouch = touches[i];
						break;
					}
				}
			}

			if (!targetTouch) return;
			clientX = targetTouch.clientX;
		} else {
			const mouse = e as MouseEvent | React.MouseEvent;
			clientX = mouse.clientX;
		}

		const deltaX = clientX - centerX;
		const maxDistance = 80;
		const constrainedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));

		steeringKnobRef.current.style.transform = `translateX(${constrainedX}px)`;

		const turn = constrainedX / maxDistance;
		inputStateRef.current.turn = turn;
	};

	const handleSteeringEnd = () => {
		isSteeringRef.current = false;
		steeringTouchIdRef.current = null;

		if (steeringKnobRef.current) {
			steeringKnobRef.current.style.transform = 'translateX(0px)';
		}

		inputStateRef.current.turn = 0;
	};

	// Global event listeners
	useEffect(() => {
		const handleGlobalTouchMove = (e: TouchEvent) => {
			if (isSteeringRef.current) {
				e.preventDefault();
				handleSteeringMove(e);
			}
		};

		const handleGlobalTouchEnd = () => {
			handleSteeringEnd();
		};

		const handleGlobalMouseMove = (e: MouseEvent) => {
			if (isSteeringRef.current) {
				handleSteeringMove(e);
			}
		};

		const handleGlobalMouseUp = () => {
			handleSteeringEnd();
		};

		document.addEventListener('touchmove', handleGlobalTouchMove, {
			passive: false,
		});
		document.addEventListener('touchend', handleGlobalTouchEnd);
		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);

		return () => {
			document.removeEventListener('touchmove', handleGlobalTouchMove);
			document.removeEventListener('touchend', handleGlobalTouchEnd);
			document.removeEventListener('mousemove', handleGlobalMouseMove);
			document.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	}, []);

	if (connectionStatus === 'connecting') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
					<p className="text-white text-lg">Подключение к игре...</p>
					<p className="text-gray-300 text-sm mt-2">Комната: {gameId}</p>
				</div>
			</div>
		);
	}

	if (connectionStatus === 'disconnected') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
				<div className="text-center">
					<WifiOff className="w-12 h-12 text-white mx-auto mb-4" />
					<p className="text-white text-lg">Соединение потеряно</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
					>
						Повторить подключение
					</button>
				</div>
			</div>
		);
	}

	if (!isJoined) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
				<div className="max-w-sm w-full">
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mb-4">
							<Gamepad2 className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">
							Присоединиться к гонке
						</h1>
						<p className="text-gray-300">Введите имя игрока</p>

						<div className="flex items-center justify-center space-x-2 mt-4">
							<Wifi className="w-4 h-4 text-green-400" />
							<span className="text-green-400 text-sm">Подключено</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
						<input
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && joinGame()}
							placeholder="Ваше имя"
							className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
							maxLength={20}
							autoFocus
						/>
						<button
							onClick={joinGame}
							disabled={!playerName.trim() || !connected}
							className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
						>
							{connected ? 'Присоединиться' : 'Подключение...'}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col overflow-hidden z-50">
			{/* Header */}
			<div className="bg-black/50 backdrop-blur-lg px-4 py-3 border-b border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Flag className="w-5 h-5 text-yellow-400" />
						<span className="text-white font-medium">{playerName}</span>
						{playerData && (
							<div
								className="w-4 h-4 rounded-full border border-white/30"
								style={{ backgroundColor: playerData.color }}
							/>
						)}
					</div>
					<div className="flex items-center space-x-3 text-sm">
						<div className="flex items-center space-x-1 text-yellow-400">
							<Trophy className="w-4 h-4" />
							<span>Lap {playerData?.lap || 0}</span>
						</div>
						<div className="flex items-center space-x-1 text-green-400">
							<Wifi className="w-4 h-4" />
						</div>
					</div>
				</div>

				{/* Speedometer */}
				{playerData && (
					<div className="mt-2 bg-gray-800/50 rounded-lg p-2">
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-gray-400">Speed</span>
							<div className="flex items-center space-x-1">
								<Gauge className="w-3 h-3 text-blue-400" />
								<span className="text-xs text-white font-bold">
									{Math.round(Math.abs(playerData.speed))} km/h
								</span>
							</div>
						</div>
						<div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
								style={{
									width: `${Math.min(
										100,
										(Math.abs(playerData.speed) / 300) * 100
									)}%`,
								}}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="flex-1 flex flex-col justify-end p-6">
				{/* Steering */}
				<div className="mb-6">
					<div className="text-center mb-2">
						<span className="text-gray-400 text-sm">Рулевое управление</span>
					</div>
					<div
						ref={steeringRef}
						className="relative w-full h-20 bg-white/10 backdrop-blur-lg border-4 border-white/30 rounded-full opacity-90 transition-all duration-200 touch-none select-none cursor-pointer"
						onTouchStart={handleSteeringStart}
						onMouseDown={handleSteeringStart}
					>
						<div className="absolute top-1/2 left-1/2 w-1 h-10 bg-white/30 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
						<div
							ref={steeringKnobRef}
							className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-2xl border-4 border-white/60 pointer-events-none"
						></div>
					</div>
					<div className="flex justify-between mt-1 text-xs text-gray-500">
						<span>← Влево</span>
						<span>Вправо →</span>
					</div>
				</div>

				{/* Pedals */}
				<div className="grid grid-cols-2 gap-4">
					<div className="text-center">
						<button
							ref={acceleratorRef}
							onTouchStart={handleAcceleratorStart}
							onTouchEnd={handleAcceleratorEnd}
							onMouseDown={handleAcceleratorStart}
							onMouseUp={handleAcceleratorEnd}
							className="w-full h-32 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-green-400/50"
						>
							<span className="text-4xl mb-2">⬆️</span>
							<span>ГАЗ</span>
						</button>
					</div>
					<div className="text-center">
						<button
							ref={brakeRef}
							onTouchStart={handleBrakeStart}
							onTouchEnd={handleBrakeEnd}
							onMouseDown={handleBrakeStart}
							onMouseUp={handleBrakeEnd}
							className="w-full h-32 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-red-400/50"
						>
							<span className="text-4xl mb-2">⬇️</span>
							<span>ТОРМОЗ</span>
						</button>
					</div>
				</div>
			</div>

			{/* Instructions */}
			<div className="p-4 bg-black/30 backdrop-blur-lg">
				<p className="text-gray-400 text-sm text-center">
					Рулите свайпом • Газ и тормоз кнопками • Проезжайте через чекпоинты
				</p>
			</div>
		</div>
	);
};

export default RaceMobileController;
