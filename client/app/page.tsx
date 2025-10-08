'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Users, Zap, Target, Car, Play } from 'lucide-react';
import { ENV_CONFIG } from '@/env.config';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameInfo {
	id: string;
	name: string;
	description: string;
	minPlayers: number;
	maxPlayers: number;
	icon: string;
}

export default function Home() {
	const router = useRouter();
	const [games, setGames] = useState<Record<string, GameInfo>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Load available games list
		const apiUrl =
			typeof window !== 'undefined' && window.location.hostname === 'localhost'
				? `http://localhost:${ENV_CONFIG.SERVER_PORT}/api/games`
				: `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}/api/games`;

		console.log('Fetching games from:', apiUrl);

		fetch(apiUrl)
			.then((res) => {
				console.log('Response status:', res.status);
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return res.json();
			})
			.then((data) => {
				console.log('Games loaded:', data);
				console.log('Games type:', typeof data);
				console.log('Games keys:', Object.keys(data));
				setGames(data || {});
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error loading games:', error);
				setError(error.message);
				setLoading(false);
			});
	}, []);

	const startGame = (gameType: string) => {
		const roomId = Math.random().toString(36).substring(2, 8);
		router.push(`/game/${gameType}?roomId=${roomId}`);
	};

	const getGameIcon = (gameType: string) => {
		switch (gameType) {
			case 'shooter':
				return <Target className="w-12 h-12 text-white" />;
			case 'race':
				return <Car className="w-12 h-12 text-white" />;
			default:
				return <Gamepad2 className="w-12 h-12 text-white" />;
		}
	};

	const getGameGradient = (index: number) => {
		const gradients = [
			'from-green-400 to-blue-500',
			'from-purple-400 to-pink-500',
			'from-orange-400 to-red-500',
			'from-cyan-400 to-blue-500',
		];
		return gradients[index % gradients.length];
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
					<div className="text-white text-xl">Loading games...</div>
				</div>
			</div>
		);
	}

	const gamesArray = Object.entries(games);
	const hasGames = gamesArray.length > 0;

	if (error || !hasGames) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					<div className="text-red-400 text-xl mb-4">⚠️ No games available</div>
					<div className="text-gray-400 text-sm mb-4">
						Make sure the server is running on port {ENV_CONFIG.SERVER_PORT}
					</div>
					{error && (
						<div className="text-red-300 text-xs mb-4 p-3 bg-red-900/20 rounded">
							Error: {error}
						</div>
					)}
					<Button
						onClick={() => window.location.reload()}
						className="mt-4 bg-blue-600 hover:bg-blue-700"
					>
						Reload
					</Button>
					<div className="mt-6 text-left text-xs text-gray-500 p-4 bg-gray-800/30 rounded">
						<div className="font-bold mb-2">Debug info:</div>
						<div>Server port: {ENV_CONFIG.SERVER_PORT}</div>
						<div>Games count: {gamesArray.length}</div>
						<div>
							API URL: http://localhost:{ENV_CONFIG.SERVER_PORT}/api/games
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col items-center justify-center p-4">
			<div className="max-w-7xl w-full py-8">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-6 shadow-2xl animate-pulse">
						<Gamepad2 className="w-12 h-12 text-white" />
					</div>
					<h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
						One Screen Games
					</h1>
					<p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
						Choose a game and turn any screen into a multiplayer arena.
						<br />
						<span className="text-green-400 font-semibold">
							Your phone becomes the controller. No downloads.
						</span>
					</p>
				</div>

				{/* Carousel with Game Cards */}
				<div className="mb-12 px-4">
					<Carousel
						opts={{
							align: 'start',
							loop: false,
						}}
						className="w-full max-w-5xl mx-auto"
					>
						<CarouselContent>
							{gamesArray.map(([gameType, gameInfo], index) => (
								<CarouselItem
									key={gameType}
									className="md:basis-1/2 lg:basis-1/2"
								>
									<div className="p-2">
										<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
											<CardHeader>
												<div className="flex items-center justify-between mb-4">
													<div
														className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${getGameGradient(
															index
														)} rounded-xl shadow-lg`}
													>
														{getGameIcon(gameType)}
													</div>
													<Badge
														variant="secondary"
														className="bg-green-500/20 text-green-400 border-green-500/30"
													>
														<Zap className="w-3 h-3 mr-1" />
														Fast game
													</Badge>
												</div>
												<CardTitle className="text-3xl text-white mb-2">
													{gameInfo.name}
												</CardTitle>
												<CardDescription className="text-gray-300 text-base">
													{gameInfo.description}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex items-center space-x-4 text-sm text-gray-400">
													<div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-lg">
														<Users className="w-4 h-4 text-blue-400" />
														<span className="text-white">
															{gameInfo.minPlayers}-{gameInfo.maxPlayers}{' '}
															players
														</span>
													</div>
													<div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-lg">
														<span className="text-2xl">{gameInfo.icon}</span>
													</div>
												</div>
											</CardContent>
											<CardFooter>
												<Button
													onClick={() => startGame(gameType)}
													className={`w-full bg-gradient-to-r ${getGameGradient(
														index
													)} hover:opacity-90 text-white font-semibold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-200`}
												>
													<Play className="w-5 h-5 mr-2" />
													Start Game
												</Button>
											</CardFooter>
										</Card>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white -left-4" />
						<CarouselNext className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white -right-4" />
					</Carousel>
				</div>

				{/* Instructions */}
				<Card className="bg-white/5 border-white/10 backdrop-blur-lg max-w-4xl mx-auto">
					<CardHeader>
						<CardTitle className="text-2xl text-white text-center">
							How to play?
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-3 gap-6 text-gray-300">
							<div className="text-center p-4 bg-gray-800/30 rounded-xl">
								<div className="text-5xl mb-3">1️⃣</div>
								<p className="text-base font-medium">
									Choose a game and start the screen
								</p>
							</div>
							<div className="text-center p-4 bg-gray-800/30 rounded-xl">
								<div className="text-5xl mb-3">2️⃣</div>
								<p className="text-base font-medium">
									Scan QR code with mobile devices
								</p>
							</div>
							<div className="text-center p-4 bg-gray-800/30 rounded-xl">
								<div className="text-5xl mb-3">3️⃣</div>
								<p className="text-base font-medium">
									Play together on one screen!
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
