'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import Autoplay from 'embla-carousel-autoplay';

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

	const plugin = useRef(
		Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
	);

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
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
			<div className="max-w-7xl w-full mx-auto px-4 py-12 space-y-16">
				{/* Hero Section */}
				<div className="text-center space-y-6">
					<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-2xl animate-pulse">
						<Gamepad2 className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-5xl font-medium text-white tracking-tight">
						One Screen Games
					</h1>
					<p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed font-light">
						Turn any screen into a multiplayer arena.
						<br />
						<span className="text-green-400 font-medium text-2xl">
							Your phone becomes the controller. No app download required.
						</span>
					</p>
				</div>

				{/* Main Value Proposition */}
				<div className="max-w-4xl mx-auto">
					<Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 backdrop-blur-lg">
						<CardHeader className="text-center">
							<CardTitle className="text-2xl text-white mb-4 font-medium">
								🎮 The Revolution in Multiplayer Gaming
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6 text-gray-200 text-base font-light">
							<p className="leading-relaxed">
								<strong className="text-green-400 font-medium">
									Forget expensive consoles and gamepads!
								</strong>{' '}
								With One Screen Games, your smartphone becomes a full-featured
								game controller in seconds.
							</p>
							<p className="leading-relaxed">
								Simply open a game on the big screen — TV, monitor, or projector
								— and{' '}
								<strong className="text-blue-400 font-medium">
									scan the QR code with your phone
								</strong>
								. That's it! No downloads, no setup, no registration.
							</p>
							<div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6 mt-6">
								<p className="text-lg font-medium text-green-300 mb-2">
									✨ Perfect for:
								</p>
								<ul className="space-y-2 text-base">
									<li>🎉 Parties and celebrations</li>
									<li>👨‍👩‍👧‍👦 Family game nights</li>
									<li>🏢 Corporate events</li>
									<li>🎪 Interactive zones at events</li>
									<li>🎓 Educational activities</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Mobile Controller Features */}
				<div className="max-w-5xl mx-auto">
					<h2 className="text-3xl font-medium text-white text-center mb-8">
						🚀 Mobile Controller Features
					</h2>
					<div className="grid md:grid-cols-2 gap-6">
						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<CardTitle className="text-xl text-white flex items-center font-medium">
									<span className="text-2xl mr-3">📱</span>
									Intuitive Controls
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 text-sm font-light">
								Your phone transforms into a full gamepad with touch buttons,
								joysticks, and gyroscope. Controls adapt to each game
								automatically.
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<CardTitle className="text-xl text-white flex items-center font-medium">
									<span className="text-2xl mr-3">⚡</span>
									Instant Connection
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 text-sm font-light">
								One QR code and you're in! No registration, no app installation.
								Connect in 3 seconds and start playing immediately.
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<CardTitle className="text-xl text-white flex items-center font-medium">
									<span className="text-2xl mr-3">👥</span>
									Multiple Players
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 text-sm font-light">
								Up to 8 players simultaneously! Each with their own unique
								color, name, and personal controller. Perfect for groups.
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<CardTitle className="text-xl text-white flex items-center font-medium">
									<span className="text-2xl mr-3">🎯</span>
									Responsive
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 text-sm font-light">
								Minimal latency thanks to WebSocket connection. Your phone
								actions are instantly reflected on the main screen.
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Games Carousel */}
				<div className="space-y-8">
					<h2 className="text-3xl font-medium text-white text-center">
						🎮 Choose Your Game
					</h2>
					<Carousel
						plugins={[plugin.current]}
						opts={{
							align: 'start',
							loop: true,
						}}
						className="w-full max-w-5xl mx-auto"
					>
						<CarouselContent className="-ml-2 md:-ml-4">
							{gamesArray.map(([gameType, gameInfo], index) => (
								<CarouselItem
									key={gameType}
									className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2"
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
														Fast Game
													</Badge>
												</div>
												<CardTitle className="text-2xl text-white mb-2 font-medium">
													{gameInfo.name}
												</CardTitle>
												<CardDescription className="text-gray-300 text-sm font-light">
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
													)} hover:opacity-90 text-white font-medium py-5 text-base shadow-xl hover:shadow-2xl transition-all duration-200`}
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
						<CarouselPrevious className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white" />
						<CarouselNext className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white" />
					</Carousel>
				</div>

				{/* How it Works */}
				<Card className="bg-white/5 border-white/10 backdrop-blur-lg max-w-4xl mx-auto">
					<CardHeader>
						<CardTitle className="text-2xl text-white text-center font-medium">
							🎯 How It Works
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-3 gap-8 text-gray-300 font-light">
							<div className="text-center p-6 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
								<div className="text-5xl mb-4">1️⃣</div>
								<h3 className="text-lg font-medium text-white mb-3">
									Launch Game
								</h3>
								<p className="text-sm leading-relaxed">
									Choose a game and open it on the big screen — TV, monitor or
									projector
								</p>
							</div>
							<div className="text-center p-6 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
								<div className="text-5xl mb-4">2️⃣</div>
								<h3 className="text-lg font-medium text-white mb-3">
									Scan QR Code
								</h3>
								<p className="text-sm leading-relaxed">
									Point your phone camera at the QR code — your phone becomes
									controller instantly
								</p>
							</div>
							<div className="text-center p-6 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all">
								<div className="text-5xl mb-4">3️⃣</div>
								<h3 className="text-lg font-medium text-white mb-3">Play!</h3>
								<p className="text-sm leading-relaxed">
									Control your character from your phone and compete with
									friends on one screen
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Technical Features */}
				<div className="max-w-4xl mx-auto">
					<Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur-lg">
						<CardHeader className="text-center">
							<CardTitle className="text-2xl text-white mb-4 font-medium">
								💎 Technical Advantages
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-gray-200 text-sm font-light">
							<div className="flex items-start space-x-4">
								<span className="text-xl">🌐</span>
								<div>
									<h4 className="font-medium text-white text-base mb-1">
										Works in Browser
									</h4>
									<p>
										Nothing to install. Works on any device with a browser —
										iOS, Android, Windows, Mac.
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-4">
								<span className="text-xl">🔒</span>
								<div>
									<h4 className="font-medium text-white text-base mb-1">
										Privacy
									</h4>
									<p>
										Games run locally on your network. No data is sent to
										external servers.
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-4">
								<span className="text-xl">⚙️</span>
								<div>
									<h4 className="font-medium text-white text-base mb-1">
										No Lag
									</h4>
									<p>
										Using WebSocket for real-time communication. Controls are
										responsive, just like a real gamepad.
									</p>
								</div>
							</div>
							<div className="flex items-start space-x-4">
								<span className="text-xl">🎨</span>
								<div>
									<h4 className="font-medium text-white text-base mb-1">
										Modern Design
									</h4>
									<p>
										Beautiful graphics powered by PixiJS, responsive interface
										and smooth animations.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* CTA Section */}
				<div className="text-center space-y-6 pb-12">
					<h2 className="text-4xl font-medium text-white">
						Ready to Start Playing?
					</h2>
					<p className="text-gray-300 text-lg max-w-2xl mx-auto font-light">
						Choose a game above and turn any screen into a gaming arena in
						seconds!
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-6 py-3 text-sm font-light">
							✓ No app installation
						</Badge>
						<Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-6 py-3 text-sm font-light">
							✓ Free
						</Badge>
						<Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-6 py-3 text-sm font-light">
							✓ Up to 8 players
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}
