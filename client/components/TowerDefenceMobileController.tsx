'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../env.config';
import {
	Castle,
	Coins,
	Heart,
	Waves as WavesIcon,
	TrendingUp,
	DollarSign,
	Play,
	Zap,
} from 'lucide-react';

interface TowerDefenceMobileControllerProps {
	gameId: string;
	gameType: string;
}

export default function TowerDefenceMobileController({
	gameId,
	gameType,
}: TowerDefenceMobileControllerProps) {
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [isJoined, setIsJoined] = useState(false);
	const [gameState, setGameState] = useState<any>(null);
	const [selectedTower, setSelectedTower] = useState<string | null>(null);

	useEffect(() => {
		const socket = io(
			`http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}`,
			{
				transports: ['websocket', 'polling'],
			}
		);

		socket.on('connect', () => {
			console.log('[TD Controller] Connected');
			setIsConnected(true);
		});

		socket.on('disconnect', () => {
			console.log('[TD Controller] Disconnected');
			setIsConnected(false);
		});

		socket.on('playerJoined', (data: any) => {
			console.log('[TD Controller] Joined:', data);
			setIsJoined(true);
		});

		socket.on('gameState', (state: any) => {
			setGameState(state);
		});

		socketRef.current = socket;

		return () => {
			socket.disconnect();
		};
	}, []);

	const handleJoin = () => {
		if (!socketRef.current || !playerName) return;

		socketRef.current.emit('joinRoom', {
			roomId: gameId,
			playerName,
		});
	};

	const buildTower = (spotId: string, type: string) => {
		if (!socketRef.current) return;

		socketRef.current.emit('playerInput', {
			action: 'buildTower',
			spotId,
			towerType: type,
		});
	};

	const upgradeTower = (towerId: string) => {
		if (!socketRef.current) return;

		socketRef.current.emit('playerInput', {
			action: 'upgradeTower',
			towerId,
		});
	};

	const sellTower = (towerId: string) => {
		if (!socketRef.current) return;

		socketRef.current.emit('playerInput', {
			action: 'sellTower',
			towerId,
		});
	};

	const startWave = () => {
		if (!socketRef.current) return;
		socketRef.current.emit('playerInput', { action: 'startWave' });
	};

	if (!isJoined) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-gray-700">
					<div className="text-center mb-6">
						<Castle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
						<h1 className="text-3xl font-bold text-white mb-2">
							Tower Defence
						</h1>
						<p className="text-gray-400">Control Panel</p>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Your Name
							</label>
							<input
								type="text"
								value={playerName}
								onChange={(e) => setPlayerName(e.target.value)}
								className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
								placeholder="Enter your name"
								maxLength={20}
							/>
						</div>

						<button
							onClick={handleJoin}
							disabled={!isConnected || !playerName}
							className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
						>
							{isConnected ? 'Join Game' : 'Connecting...'}
						</button>

						<div className="flex items-center justify-center space-x-2 text-sm">
							<div
								className={`w-2 h-2 rounded-full ${
									isConnected ? 'bg-green-400' : 'bg-red-400'
								}`}
							/>
							<span className="text-gray-400">
								{isConnected ? 'Connected' : 'Disconnected'}
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
			<div className="max-w-md mx-auto">
				{/* Game Stats */}
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-700">
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center space-x-2">
							<Coins className="w-5 h-5 text-yellow-400" />
							<div>
								<div className="text-xs text-gray-400">Money</div>
								<div className="text-lg font-bold text-white">
									{gameState?.money || 0}
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Heart className="w-5 h-5 text-red-400" />
							<div>
								<div className="text-xs text-gray-400">Castle HP</div>
								<div className="text-lg font-bold text-white">
									{gameState?.castle?.health}/{gameState?.castle?.maxHealth}
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<WavesIcon className="w-5 h-5 text-blue-400" />
							<div>
								<div className="text-xs text-gray-400">Wave</div>
								<div className="text-lg font-bold text-white">
									{gameState?.wave || 0}
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Castle className="w-5 h-5 text-purple-400" />
							<div>
								<div className="text-xs text-gray-400">Towers</div>
								<div className="text-lg font-bold text-white">
									{gameState?.towers?.length || 0}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Start Wave Button */}
				{gameState && !gameState.isWaveActive && !gameState.gameOver && (
					<button
						onClick={startWave}
						className="w-full mb-4 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
					>
						<Play className="w-6 h-6" />
						<span>Start Next Wave</span>
					</button>
				)}

				{/* Tower Types */}
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-700">
					<h2 className="text-lg font-bold text-white mb-3">Tower Types</h2>
					<div className="grid grid-cols-2 gap-2">
						{[
							{
								type: 'basic',
								name: 'Basic',
								cost: 50,
								color: 'gray',
								desc: 'Balanced tower',
							},
							{
								type: 'rapid',
								name: 'Rapid',
								cost: 75,
								color: 'yellow',
								desc: 'Fast fire rate',
							},
							{
								type: 'sniper',
								name: 'Sniper',
								cost: 150,
								color: 'blue',
								desc: 'Long range',
							},
							{
								type: 'splash',
								name: 'Splash',
								cost: 100,
								color: 'orange',
								desc: 'Area damage',
							},
						].map((tower) => (
							<div
								key={tower.type}
								className={`bg-${tower.color}-900/20 border border-${tower.color}-700/50 rounded-lg p-3`}
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-white font-semibold text-sm">
										{tower.name}
									</span>
									<div className="flex items-center space-x-1 text-yellow-400">
										<DollarSign className="w-3 h-3" />
										<span className="text-xs">{tower.cost}</span>
									</div>
								</div>
								<p className="text-xs text-gray-400">{tower.desc}</p>
							</div>
						))}
					</div>
				</div>

				{/* Build Spots */}
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-700">
					<h2 className="text-lg font-bold text-white mb-3">Build Spots</h2>
					<div className="space-y-2 max-h-64 overflow-y-auto">
						{gameState?.buildSpots?.map((spot: any, index: number) => (
							<div
								key={spot.id}
								className={`p-3 rounded-lg border ${
									spot.occupied
										? 'bg-gray-700/50 border-gray-600'
										: 'bg-green-900/20 border-green-700/50'
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="text-white text-sm">
										<span className="font-bold text-green-400">
											#{index + 1}
										</span>{' '}
										{spot.occupied ? 'Tower' : 'Empty'}
									</span>
									{!spot.occupied && (
										<div className="flex space-x-1">
											{['basic', 'rapid', 'sniper', 'splash'].map((type) => (
												<button
													key={type}
													onClick={() => buildTower(spot.id, type)}
													className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
												>
													{type[0].toUpperCase()}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Towers */}
				{gameState?.towers && gameState.towers.length > 0 && (
					<div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
						<h2 className="text-lg font-bold text-white mb-3">Your Towers</h2>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{gameState.towers.map((tower: any) => (
								<div
									key={tower.id}
									className="bg-gray-700/50 border border-gray-600 rounded-lg p-3"
								>
									<div className="flex items-center justify-between mb-2">
										<div>
											<span className="text-white font-semibold text-sm">
												{tower.type.charAt(0).toUpperCase() +
													tower.type.slice(1)}{' '}
												Tower
											</span>
											<div className="text-xs text-gray-400">
												Level {tower.level}
											</div>
										</div>
										<div className="flex space-x-2">
											<button
												onClick={() => upgradeTower(tower.id)}
												className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors flex items-center space-x-1"
											>
												<TrendingUp className="w-3 h-3" />
												<span>Up</span>
											</button>
											<button
												onClick={() => sellTower(tower.id)}
												className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
											>
												Sell
											</button>
										</div>
									</div>
									<div className="flex items-center space-x-3 text-xs text-gray-400">
										<span>DMG: {tower.damage}</span>
										<span>Range: {tower.range}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Game Over */}
				{gameState?.gameOver && (
					<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
						<div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 border border-gray-700 text-center">
							<Zap className="w-16 h-16 text-red-500 mx-auto mb-4" />
							<h2 className="text-3xl font-bold text-red-500 mb-2">
								Game Over!
							</h2>
							<p className="text-white text-xl mb-4">
								Survived {gameState.wave} waves
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
