'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Brain, Trophy, Wifi, WifiOff, CheckCircle, Clock } from 'lucide-react';
import { ENV_CONFIG } from '../env.config';

interface QuizMobileControllerProps {
	gameId: string;
	gameType: string;
}

interface PlayerData {
	id: string;
	name: string;
	color: string;
	avatar: string;
	score: number;
	ready: boolean;
	correctAnswers: number;
	wrongAnswers: number;
}

interface GameState {
	gameStarted: boolean;
	gameFinished: boolean;
	currentRound: number;
	totalRounds: number;
	question?: {
		text: string;
		answers: string[];
	};
	timeRemaining?: number;
	roundDuration?: number;
	showingResults?: boolean;
	correctAnswer?: number;
	playerAnswers?: {
		[playerId: string]: {
			answer: number;
			correct: boolean;
		};
	};
	winners?: string[];
	players?: PlayerData[];
}

const QuizMobileController: React.FC<QuizMobileControllerProps> = ({
	gameId,
	gameType,
}) => {
	const [connected, setConnected] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [isJoined, setIsJoined] = useState(false);
	const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [hasAnswered, setHasAnswered] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		'connecting' | 'connected' | 'disconnected'
	>('connecting');

	const socketRef = useRef<Socket | null>(null);

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

		socket.on('gameState', (state: GameState) => {
			console.log('Game state received:', state);
			setGameState(state);

			// Update player data
			const player = state.players?.find((p) => p.id === socket.id);
			if (player) {
				setPlayerData(player);
			}

			// Reset answer state when new round starts
			if (state.gameStarted && !state.showingResults && state.question) {
				if (gameState?.currentRound !== state.currentRound) {
					setSelectedAnswer(null);
					setHasAnswered(false);
				}
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const joinGame = () => {
		if (socketRef.current && playerName.trim() && connected) {
			console.log('Attempting to join room with name:', playerName.trim());
			socketRef.current.emit('joinRoom', {
				roomId: gameId,
				playerName: playerName.trim(),
			});
		}
	};

	const toggleReady = () => {
		if (socketRef.current && isJoined) {
			const newReadyState = !playerData?.ready;
			socketRef.current.emit('playerInput', {
				type: 'ready',
				ready: newReadyState,
			});
		}
	};

	const submitAnswer = (answerIndex: number) => {
		if (
			socketRef.current &&
			isJoined &&
			!hasAnswered &&
			gameState?.gameStarted &&
			!gameState?.showingResults
		) {
			setSelectedAnswer(answerIndex);
			setHasAnswered(true);
			socketRef.current.emit('playerInput', {
				type: 'answer',
				answerIndex,
			});
		}
	};

	const renderConnectionStatus = () => {
		if (connectionStatus === 'connected') {
			return (
				<div className="flex items-center gap-2 text-green-400">
					<Wifi size={16} />
					<span className="text-sm">Connected</span>
				</div>
			);
		} else if (connectionStatus === 'connecting') {
			return (
				<div className="flex items-center gap-2 text-yellow-400">
					<Wifi size={16} className="animate-pulse" />
					<span className="text-sm">Connecting...</span>
				</div>
			);
		} else {
			return (
				<div className="flex items-center gap-2 text-red-400">
					<WifiOff size={16} />
					<span className="text-sm">Disconnected</span>
				</div>
			);
		}
	};

	// Join screen
	if (!isJoined) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
				<div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
							<Brain size={32} className="text-purple-600" />
							Quiz Battle
						</h1>
						{renderConnectionStatus()}
					</div>

					<div className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Your nickname
							</label>
							<input
								type="text"
								value={playerName}
								onChange={(e) => setPlayerName(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										joinGame();
									}
								}}
								placeholder="Enter your name"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg text-gray-900"
								maxLength={20}
								disabled={!connected}
							/>
						</div>

						<button
							onClick={joinGame}
							disabled={!playerName.trim() || !connected}
							className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
						>
							Join Game
						</button>

						{!connected && (
							<p className="text-red-400 text-center text-sm">
								No connection to server. Check your connection.
							</p>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Waiting room
	if (!gameState?.gameStarted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
				{/* Header */}
				<div className="bg-gray-900 p-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div
							className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
							style={{ backgroundColor: playerData?.color + '33' }}
						>
							{playerData?.avatar}
						</div>
						<div>
							<div className="text-white font-bold">{playerData?.name}</div>
							<div className="text-gray-400 text-sm">
								{playerData?.score || 0} pts
							</div>
						</div>
					</div>
					{renderConnectionStatus()}
				</div>

				{/* Content */}
				<div className="flex-1 flex flex-col items-center justify-center p-6">
					<Brain size={80} className="text-white mb-6" />
					<h1 className="text-4xl font-bold text-white text-center mb-4">
						Waiting for players...
					</h1>
					<p className="text-xl text-gray-300 text-center mb-8">
						{gameState?.players?.length || 0} players connected
					</p>

					<button
						onClick={toggleReady}
						className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all transform hover:scale-105 active:scale-95 ${
							playerData?.ready
								? 'bg-green-500 text-white'
								: 'bg-white text-gray-900'
						}`}
					>
						{playerData?.ready ? (
							<div className="flex items-center gap-3">
								<CheckCircle size={32} />
								<span>Ready!</span>
							</div>
						) : (
							"I'm Ready"
						)}
					</button>

					{playerData?.ready && (
						<p className="text-green-400 text-lg mt-4">
							Waiting for other players...
						</p>
					)}
				</div>
			</div>
		);
	}

	// Game finished
	if (gameState.gameFinished) {
		const isWinner = gameState.winners?.includes(playerData?.id || '');
		const rank = gameState.players
			?.sort((a, b) => b.score - a.score)
			.findIndex((p) => p.id === playerData?.id);

		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
				<div className="text-center">
					{isWinner && (
						<>
							<div className="text-9xl mb-6 animate-bounce">🏆</div>
							<h1 className="text-6xl font-bold text-yellow-300 mb-4">
								Victory!
							</h1>
						</>
					)}
					{!isWinner && rank !== undefined && (
						<>
							<div className="text-9xl mb-6">
								{rank === 1 ? '🥈' : rank === 2 ? '🥉' : '🎮'}
							</div>
							<h1 className="text-5xl font-bold text-white mb-4">
								{rank + 1}
								{rank === 0
									? 'st'
									: rank === 1
									? 'nd'
									: rank === 2
									? 'rd'
									: 'th'}{' '}
								Place
							</h1>
						</>
					)}

					<div
						className="w-32 h-32 rounded-full flex items-center justify-center text-6xl mx-auto mb-6"
						style={{ backgroundColor: playerData?.color }}
					>
						{playerData?.avatar}
					</div>

					<div className="bg-white rounded-3xl p-8 max-w-md">
						<div className="text-4xl font-bold text-gray-900 mb-2">
							{playerData?.name}
						</div>
						<div
							className="text-6xl font-bold mb-6"
							style={{ color: playerData?.color }}
						>
							{playerData?.score} pts
						</div>
						<div className="grid grid-cols-2 gap-4 text-center">
							<div className="bg-green-100 rounded-xl p-4">
								<div className="text-3xl font-bold text-green-600">
									{playerData?.correctAnswers || 0}
								</div>
								<div className="text-sm text-green-800">Correct</div>
							</div>
							<div className="bg-red-100 rounded-xl p-4">
								<div className="text-3xl font-bold text-red-600">
									{playerData?.wrongAnswers || 0}
								</div>
								<div className="text-sm text-red-800">Wrong</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Showing results
	if (gameState.showingResults) {
		const myAnswer = gameState.playerAnswers?.[playerData?.id || ''];
		const isCorrect = myAnswer?.correct;
		const answered =
			myAnswer?.answer !== null && myAnswer?.answer !== undefined;

		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
				{/* Header */}
				<div className="bg-gray-900 p-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div
							className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
							style={{ backgroundColor: playerData?.color + '33' }}
						>
							{playerData?.avatar}
						</div>
						<div>
							<div className="text-white font-bold">{playerData?.name}</div>
							<div className="text-gray-400 text-sm">
								{playerData?.score || 0} pts
							</div>
						</div>
					</div>
					<div className="text-white text-lg">
						Round {gameState.currentRound}/{gameState.totalRounds}
					</div>
				</div>

				{/* Results */}
				<div className="flex-1 flex flex-col items-center justify-center p-6">
					<div className={`text-9xl mb-6 ${isCorrect ? 'animate-bounce' : ''}`}>
						{isCorrect ? '✅' : answered ? '❌' : '⏭️'}
					</div>
					<h1
						className={`text-5xl font-bold mb-4 ${
							isCorrect
								? 'text-green-400'
								: answered
								? 'text-red-400'
								: 'text-gray-400'
						}`}
					>
						{isCorrect ? 'Correct!' : answered ? 'Wrong' : "Time's up"}
					</h1>

					{gameState.question && (
						<div className="bg-white rounded-2xl p-6 max-w-md w-full">
							<div className="text-lg font-semibold text-gray-900 mb-4 text-center">
								Correct answer:
							</div>
							<div className="bg-green-100 border-4 border-green-500 rounded-xl p-4">
								<div className="text-xl font-bold text-green-800 text-center">
									{String.fromCharCode(65 + (gameState.correctAnswer || 0))}.{' '}
									{gameState.question.answers[gameState.correctAnswer || 0]}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Active gameplay
	const timePercent =
		gameState.timeRemaining && gameState.roundDuration
			? (gameState.timeRemaining / gameState.roundDuration) * 100
			: 100;

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
			{/* Header */}
			<div className="bg-gray-900 p-4">
				<div className="flex justify-between items-center mb-3">
					<div className="flex items-center gap-3">
						<div
							className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
							style={{ backgroundColor: playerData?.color + '33' }}
						>
							{playerData?.avatar}
						</div>
						<div>
							<div className="text-white font-bold">{playerData?.name}</div>
							<div className="text-gray-400 text-sm">
								{playerData?.score || 0} pts
							</div>
						</div>
					</div>
					<div className="text-white text-right">
						<div className="text-sm text-gray-400">
							Раунд {gameState.currentRound}/{gameState.totalRounds}
						</div>
						<div className="text-2xl font-bold flex items-center gap-2">
							<Clock size={24} />
							{Math.ceil(gameState.timeRemaining || 0)}s
						</div>
					</div>
				</div>

				{/* Time bar */}
				<div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
					<div
						className="h-full transition-all duration-1000 ease-linear"
						style={{
							width: `${timePercent}%`,
							backgroundColor:
								timePercent > 50
									? '#10b981'
									: timePercent > 25
									? '#f59e0b'
									: '#ef4444',
						}}
					/>
				</div>
			</div>

			{/* Question and answers */}
			<div className="flex-1 flex flex-col p-6">
				<div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl">
					<h2 className="text-2xl font-bold text-gray-900 text-center leading-tight">
						{gameState.question?.text}
					</h2>
				</div>

				{/* Answer buttons */}
				<div className="flex-1 flex flex-col gap-4">
					{gameState.question?.answers.map((answer, index) => {
						const isSelected = selectedAnswer === index;
						return (
							<button
								key={index}
								onClick={() => submitAnswer(index)}
								disabled={hasAnswered}
								className={`flex-1 rounded-2xl p-6 font-bold text-xl transition-all transform active:scale-95 ${
									isSelected
										? 'bg-blue-500 text-white scale-105'
										: hasAnswered
										? 'bg-gray-600 text-gray-400 cursor-not-allowed'
										: 'bg-white text-gray-900 hover:bg-gray-100'
								}`}
							>
								<div className="flex items-center gap-4">
									<div
										className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
											isSelected
												? 'bg-blue-700 text-white'
												: 'bg-gray-200 text-gray-700'
										}`}
									>
										{String.fromCharCode(65 + index)}
									</div>
									<div className="flex-1 text-left">{answer}</div>
									{isSelected && <CheckCircle size={32} />}
								</div>
							</button>
						);
					})}
				</div>

				{hasAnswered && (
					<div className="mt-4 bg-green-500 text-white text-center py-3 rounded-xl font-bold">
						Answer sent! Waiting for other players...
					</div>
				)}
			</div>
		</div>
	);
};

export default QuizMobileController;
