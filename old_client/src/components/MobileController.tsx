import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
	Gamepad2,
	Zap,
	Heart,
	Trophy,
	Shield,
	Gauge,
	Wifi,
	WifiOff,
	Navigation,
	Compass,
} from 'lucide-react';
import { ENV_CONFIG } from '../../env.config';

interface MobileControllerProps {
	gameId: string;
}

interface PlayerData {
	id: string;
	name: string;
	x: number;
	y: number;
	color: string;
	facingDirection?: { x: number; y: number };
	aimDirection?: { x: number; y: number };
	isMoving?: boolean;
}

const MobileController: React.FC<MobileControllerProps> = ({ gameId }) => {
	const [connected, setConnected] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [isJoined, setIsJoined] = useState(false);
	const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [playerStats, setPlayerStats] = useState({
		kills: 0,
		deaths: 0,
		alive: true,
		effects: {
			speedBoost: { active: false, endTime: 0 },
			shield: { active: false, endTime: 0 },
		},
	});
	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');

	const socketRef = useRef<Socket | null>(null);
	const joystickRef = useRef<HTMLDivElement>(null);
	const knobRef = useRef<HTMLDivElement>(null);
	const inputStateRef = useRef({ x: 0, y: 0 });
	const aimDirectionRef = useRef({ x: 0, y: -1 }); // Default aim up
	const isDraggingRef = useRef(false);
	const lastInputSentRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		// Initialize socket connection
		// Use local IP from env config for mobile controllers
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
				// Initialize aim direction from player data
				if (data.playerData.aimDirection) {
					aimDirectionRef.current = data.playerData.aimDirection;
				}
			}
		});

		socket.on('gameState', (state) => {
			// Update player stats
			const player = state.players.find((p: any) => p.id === socket.id);
			if (player) {
				setPlayerStats({
					kills: player.kills,
					deaths: player.deaths,
					alive: player.alive,
					effects: player.effects || {
						speedBoost: { active: false, endTime: 0 },
						shield: { active: false, endTime: 0 },
					},
				});

				// Update player data
				setPlayerData((prev) =>
					prev
						? {
								...prev,
								x: player.x,
								y: player.y,
								facingDirection: player.facingDirection,
								aimDirection: player.aimDirection,
								isMoving: player.isMoving,
						  }
						: null
				);

				// Update local aim direction reference
				if (player.aimDirection) {
					aimDirectionRef.current = player.aimDirection;
				}
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	// Send input updates at regular intervals
	useEffect(() => {
		if (!isJoined || !socketRef.current) return;

		const sendInput = () => {
			const currentInput = inputStateRef.current;
			const lastInput = lastInputSentRef.current;

			// Only send if input has changed significantly or if there's movement
			const threshold = 0.01;
			if (
				Math.abs(currentInput.x - lastInput.x) > threshold ||
				Math.abs(currentInput.y - lastInput.y) > threshold
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
			console.log('Attempting to join game with name:', playerName.trim());
			socketRef.current.emit('joinGame', playerName.trim());
		}
	};

	const shoot = () => {
		if (socketRef.current && isJoined && playerStats.alive) {
			socketRef.current.emit('playerShoot');
			console.log('Shot fired in direction:', aimDirectionRef.current);
		}
	};

	const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
		e.preventDefault();
		isDraggingRef.current = true;

		if (joystickRef.current && knobRef.current) {
			joystickRef.current.style.opacity = '1';
			joystickRef.current.style.transform = 'scale(1.05)';
		}

		console.log('Joystick interaction started');
	};

	const handleJoystickMove = (
		e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent
	) => {
		if (!isDraggingRef.current || !joystickRef.current || !knobRef.current)
			return;

		e.preventDefault();
		const rect = joystickRef.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		let clientX, clientY;
		if (e.type.startsWith('touch')) {
			const touch =
				(e as TouchEvent).touches?.[0] || (e as React.TouchEvent).touches[0];
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			const mouse = e as MouseEvent | React.MouseEvent;
			clientX = mouse.clientX;
			clientY = mouse.clientY;
		}

		const deltaX = clientX - centerX;
		const deltaY = clientY - centerY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const maxDistance = 60; // Increased for better precision

		// Calculate normalized direction
		let normalizedX = distance > 0 ? deltaX / distance : 0;
		let normalizedY = distance > 0 ? deltaY / distance : 0;

		// Limit the knob position within the joystick circle
		const constrainedDistance = Math.min(distance, maxDistance);
		const knobX = normalizedX * constrainedDistance;
		const knobY = normalizedY * constrainedDistance;

		knobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;

		// Calculate input strength based on distance from center
		const inputStrength = Math.min(distance / maxDistance, 1);
		const newInput = {
			x: normalizedX * inputStrength,
			y: normalizedY * inputStrength,
		};

		inputStateRef.current = newInput;

		// Update aim direction when there's significant input
		if (inputStrength > 0.1) {
			aimDirectionRef.current = { x: normalizedX, y: normalizedY };

			// Send aim direction to server
			if (socketRef.current) {
				socketRef.current.emit('playerAim', aimDirectionRef.current);
			}
		}
	};

	const handleJoystickEnd = () => {
		isDraggingRef.current = false;

		if (knobRef.current) {
			knobRef.current.style.transform = 'translate(0px, 0px)';
		}

		if (joystickRef.current) {
			joystickRef.current.style.opacity = '0.9';
			joystickRef.current.style.transform = 'scale(1)';
		}

		inputStateRef.current = { x: 0, y: 0 };
		console.log('Joystick interaction ended');
	};

	// Global event listeners for better touch/mouse handling
	useEffect(() => {
		const handleGlobalMouseMove = (e: MouseEvent) => {
			if (isDraggingRef.current) {
				handleJoystickMove(e);
			}
		};

		const handleGlobalMouseUp = () => {
			if (isDraggingRef.current) {
				handleJoystickEnd();
			}
		};

		const handleGlobalTouchMove = (e: TouchEvent) => {
			if (isDraggingRef.current) {
				e.preventDefault();
				handleJoystickMove(e);
			}
		};

		const handleGlobalTouchEnd = () => {
			if (isDraggingRef.current) {
				handleJoystickEnd();
			}
		};

		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);
		document.addEventListener('touchmove', handleGlobalTouchMove, {
			passive: false,
		});
		document.addEventListener('touchend', handleGlobalTouchEnd);

		return () => {
			document.removeEventListener('mousemove', handleGlobalMouseMove);
			document.removeEventListener('mouseup', handleGlobalMouseUp);
			document.removeEventListener('touchmove', handleGlobalTouchMove);
			document.removeEventListener('touchend', handleGlobalTouchEnd);
		};
	}, []);

	// Get compass direction from aim direction
	const getCompassDirection = (aimDir: { x: number; y: number }) => {
		const angle = Math.atan2(aimDir.y, aimDir.x);
		const degrees = ((angle * 180) / Math.PI + 360) % 360;

		const directions = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
		const index = Math.round(degrees / 45) % 8;
		return directions[index];
	};

	// Get angle in degrees for visual display
	const getAimAngleDegrees = (aimDir: { x: number; y: number }) => {
		return (Math.atan2(aimDir.y, aimDir.x) * 180) / Math.PI;
	};

	if (connectionStatus === 'connecting') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
					<p className="text-white text-lg">Connecting to game...</p>
					<p className="text-gray-300 text-sm mt-2">Game ID: {gameId}</p>
				</div>
			</div>
		);
	}

	if (connectionStatus === 'disconnected') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
				<div className="text-center">
					<WifiOff className="w-12 h-12 text-white mx-auto mb-4" />
					<p className="text-white text-lg">Connection Lost</p>
					<p className="text-gray-300 text-sm mt-2">
						Unable to connect to game server
					</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
					>
						Retry Connection
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
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
							<Gamepad2 className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">
							Join QR Party
						</h1>
						<p className="text-gray-300">Enter your player name</p>

						<div className="flex items-center justify-center space-x-2 mt-4">
							<Wifi className="w-4 h-4 text-green-400" />
							<span className="text-green-400 text-sm">Connected</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
						<input
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && joinGame()}
							placeholder="Your name"
							className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
							maxLength={20}
							autoFocus
						/>
						<button
							onClick={joinGame}
							disabled={!playerName.trim() || !connected}
							className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
						>
							{connected ? 'Join Game' : 'Connecting...'}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col">
			{/* Header */}
			<div className="bg-black/50 backdrop-blur-lg px-4 py-3 border-b border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<div
							className={`w-3 h-3 rounded-full ${
								playerStats.alive ? 'bg-green-400' : 'bg-red-400'
							}`}
						/>
						<span className="text-white font-medium">{playerName}</span>
						{playerData && (
							<div
								className="w-4 h-4 rounded-full border border-white/30"
								style={{ backgroundColor: playerData.color }}
							/>
						)}
						{playerData?.isMoving && (
							<div className="flex items-center space-x-1">
								<Navigation className="w-3 h-3 text-blue-400" />
								<span className="text-blue-400 text-xs">Moving</span>
							</div>
						)}
					</div>
					<div className="flex items-center space-x-4 text-sm">
						<div className="flex items-center space-x-1 text-yellow-400">
							<Trophy className="w-4 h-4" />
							<span>{playerStats.kills}</span>
						</div>
						<div className="flex items-center space-x-1 text-red-400">
							<Heart className="w-4 h-4" />
							<span>{playerStats.deaths}</span>
						</div>
						<div className="flex items-center space-x-1 text-green-400">
							<Wifi className="w-4 h-4" />
						</div>
					</div>
				</div>

				{/* Active Effects */}
				{(playerStats.effects.speedBoost.active ||
					playerStats.effects.shield.active) && (
					<div className="flex items-center space-x-2 mt-2">
						{playerStats.effects.speedBoost.active && (
							<div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded-full">
								<Gauge className="w-3 h-3 text-orange-400" />
								<span className="text-orange-400 text-xs">Speed</span>
							</div>
						)}
						{playerStats.effects.shield.active && (
							<div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded-full">
								<Shield className="w-3 h-3 text-blue-400" />
								<span className="text-blue-400 text-xs">Shield</span>
							</div>
						)}
					</div>
				)}

				{/* Direction Display */}
				<div className="flex items-center justify-center space-x-4 mt-3 bg-gray-800/50 rounded-lg p-2">
					<div className="flex items-center space-x-2">
						<Compass className="w-4 h-4 text-blue-400" />
						<span className="text-blue-400 text-sm font-medium">
							{getCompassDirection(aimDirectionRef.current)}
						</span>
					</div>
					<div className="text-gray-400 text-xs">
						{Math.round(getAimAngleDegrees(aimDirectionRef.current))}°
					</div>
					<div
						className="w-6 h-6 border-2 border-white/50 rounded-full relative"
						style={{
							background: `conic-gradient(from ${
								getAimAngleDegrees(aimDirectionRef.current) - 10
							}deg, transparent 0deg, ${
								playerData?.color || '#ffffff'
							} 10deg, transparent 30deg)`,
						}}
					>
						<div
							className="absolute w-1 h-3 bg-white rounded-full top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"
							style={{
								transformOrigin: '50% 100%',
								transform: `translate(-50%, -4px) rotate(${getAimAngleDegrees(
									aimDirectionRef.current
								)}deg)`,
							}}
						/>
					</div>
				</div>
			</div>

			{/* Game Controls */}
			<div className="flex-1 flex flex-col justify-end p-8">
				{!playerStats.alive && (
					<div className="mb-8 text-center">
						<div className="bg-red-900/50 backdrop-blur-lg rounded-2xl p-4 border border-red-700">
							<p className="text-red-300 font-semibold">
								You've been eliminated!
							</p>
							<p className="text-red-400 text-sm mt-1">Respawning soon...</p>
						</div>
					</div>
				)}

				<div className="flex items-end justify-between">
					{/* Enhanced Joystick with 360° indicators */}
					<div className="relative">
						<div
							ref={joystickRef}
							className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-lg border-4 border-white/20 relative opacity-90 transition-all duration-200 touch-none select-none cursor-pointer"
							onTouchStart={handleJoystickStart}
							onMouseDown={handleJoystickStart}
						>
							{/* Compass directions around the joystick */}
							{['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(
								(direction, index) => {
									const angle = index * 45 - 90; // Start from North (top)
									const radian = (angle * Math.PI) / 180;
									const radius = 75;
									const x = Math.cos(radian) * radius;
									const y = Math.sin(radian) * radius;

									return (
										<div
											key={direction}
											className="absolute text-xs text-gray-400 font-bold pointer-events-none"
											style={{
												left: `calc(50% + ${x}px)`,
												top: `calc(50% + ${y}px)`,
												transform: 'translate(-50%, -50%)',
											}}
										>
											{direction}
										</div>
									);
								}
							)}

							{/* Direction markers every 45 degrees */}
							{Array.from({ length: 8 }, (_, i) => {
								const angle = i * 45 - 90;
								const radian = (angle * Math.PI) / 180;
								const innerRadius = 55;
								const outerRadius = 65;

								const currentAimAngle = getAimAngleDegrees(
									aimDirectionRef.current
								);
								const isActiveDirection =
									Math.abs(((angle - currentAimAngle + 180) % 360) - 180) < 25;

								return (
									<div
										key={i}
										className={`absolute w-0.5 h-3 ${
											isActiveDirection ? 'bg-yellow-400' : 'bg-white/30'
										} pointer-events-none`}
										style={{
											left: '50%',
											top: '50%',
											transformOrigin: `0 ${innerRadius}px`,
											transform: `translate(-50%, -${innerRadius}px) rotate(${angle}deg)`,
										}}
									/>
								);
							})}

							{/* Joystick knob */}
							<div
								ref={knobRef}
								className="absolute top-1/2 left-1/2 w-14 h-14 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-transform shadow-lg border-4 border-blue-300 pointer-events-none flex items-center justify-center"
							>
								{/* Direction indicator on knob */}
								<div
									className="w-6 h-1 bg-white rounded-full"
									style={{
										transform: `rotate(${getAimAngleDegrees(
											aimDirectionRef.current
										)}deg)`,
									}}
								/>
							</div>

							{/* Current aim direction highlight */}
							<div
								className="absolute top-1/2 left-1/2 w-16 h-1 bg-yellow-400 pointer-events-none rounded-full opacity-80"
								style={{
									transformOrigin: 'left center',
									transform: `translate(-50%, -50%) rotate(${getAimAngleDegrees(
										aimDirectionRef.current
									)}deg)`,
								}}
							/>

							{/* Movement strength indicator */}
							{(Math.abs(inputStateRef.current.x) > 0.1 ||
								Math.abs(inputStateRef.current.y) > 0.1) && (
								<div
									className="absolute top-1/2 left-1/2 bg-green-400/30 rounded-full pointer-events-none"
									style={{
										width: `${
											Math.sqrt(
												inputStateRef.current.x ** 2 +
													inputStateRef.current.y ** 2
											) * 120
										}px`,
										height: `${
											Math.sqrt(
												inputStateRef.current.x ** 2 +
													inputStateRef.current.y ** 2
											) * 120
										}px`,
										transform: 'translate(-50%, -50%)',
									}}
								/>
							)}
						</div>

						<p className="text-center text-gray-400 text-sm mt-3">
							360° Control
						</p>

						{/* Enhanced debug info */}
						<div className="text-center text-xs text-gray-500 mt-2 space-y-1">
							<div className="flex justify-center space-x-4">
								<span>
									Move: {inputStateRef.current.x.toFixed(2)},{' '}
									{inputStateRef.current.y.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-center space-x-4">
								<span>
									Aim: {getCompassDirection(aimDirectionRef.current)} (
									{Math.round(getAimAngleDegrees(aimDirectionRef.current))}°)
								</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-4">
						<button
							onTouchStart={(e) => {
								e.preventDefault();
								shoot();
							}}
							onMouseDown={(e) => {
								e.preventDefault();
								shoot();
							}}
							disabled={!playerStats.alive}
							className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 rounded-full text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center border-4 border-red-400/50 disabled:border-gray-400/50"
						>
							<Zap className="w-10 h-10" />
						</button>
						<p className="text-center text-gray-400 text-sm">Shoot</p>
						<div className="text-center text-xs text-gray-500">
							Direction: {getCompassDirection(aimDirectionRef.current)}
						</div>
					</div>
				</div>
			</div>

			{/* Instructions */}
			<div className="p-4 bg-black/30 backdrop-blur-lg">
				<p className="text-gray-400 text-sm text-center">
					Move joystick in any direction • Yellow line shows aim direction •
					Compass shows exact bearing
				</p>
				<div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
					<span>🟣 Teleporter</span>
					<span>🔶 Speed</span>
					<span>🔷 Shield</span>
					<span>🔴 Bouncer</span>
				</div>
				{playerData && (
					<div className="text-center text-xs text-gray-600 mt-1">
						Position: ({Math.round(playerData.x)}, {Math.round(playerData.y)}) •
						Facing: {getCompassDirection(aimDirectionRef.current)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MobileController;
