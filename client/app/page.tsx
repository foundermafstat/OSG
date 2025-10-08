'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
	Gamepad2,
	Users,
	Zap,
	Target,
	Car,
	Play,
	Smartphone,
	Monitor,
	QrCode,
	Wifi,
	ArrowRight,
	CheckCircle2,
	Castle,
	Sparkles,
	Trophy,
	Heart,
	Shield,
} from 'lucide-react';
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
		Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
	);

	useEffect(() => {
		const apiUrl =
			typeof window !== 'undefined' && window.location.hostname === 'localhost'
				? `http://localhost:${ENV_CONFIG.SERVER_PORT}/api/games`
				: `http://${ENV_CONFIG.LOCAL_IP}:${ENV_CONFIG.SERVER_PORT}/api/games`;

		fetch(apiUrl)
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				return res.json();
			})
			.then((data) => {
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
			case 'towerdefence':
				return <Castle className="w-12 h-12 text-white" />;
			default:
				return <Gamepad2 className="w-12 h-12 text-white" />;
		}
	};

	const getGameGradient = (index: number) => {
		const gradients = [
			'from-green-500 to-emerald-600',
			'from-purple-500 to-pink-600',
			'from-orange-500 to-red-600',
			'from-cyan-500 to-blue-600',
		];
		return gradients[index % gradients.length];
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
					<div className="text-white text-2xl font-medium">
						Loading games...
					</div>
				</div>
			</div>
		);
	}

	const gamesArray = Object.entries(games);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
			{/* Hero Section with Game Carousel */}
			<div className="relative overflow-hidden">
				{/* Animated background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 py-16 space-y-12">
					{/* Header */}
					<div className="text-center space-y-6">
						<div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full shadow-2xl animate-pulse">
							<Gamepad2 className="w-12 h-12 text-white" />
						</div>
						<div>
							<h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-4">
								One Screen Games
							</h1>
							<p className="text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 font-semibold">
								Turn any screen into a gaming arena
							</p>
						</div>
						<p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
							Your smartphone becomes a gamepad in 3 seconds.
							<br />
							<span className="text-green-400 font-semibold">
								No downloads. No installations. Just scan and play.
							</span>
						</p>
					</div>

					{/* Games Carousel */}
					<div className="space-y-6">
						<div className="text-center">
							<Badge className="bg-white/10 text-white border-white/20 px-6 py-2 text-base mb-4">
								<Sparkles className="w-4 h-4 mr-2" />
								Choose a game
							</Badge>
						</div>
						<Carousel
							plugins={[plugin.current]}
							opts={{
								align: 'center',
								loop: true,
							}}
							className="w-full max-w-6xl mx-auto"
						>
							<CarouselContent className="-ml-4">
								{gamesArray.map(([gameType, gameInfo], index) => (
									<CarouselItem
										key={gameType}
										className="pl-4 md:basis-1/2 lg:basis-1/3"
									>
										<div className="p-2">
											<Card className="bg-gray-800/70 border-gray-700 backdrop-blur-xl hover:bg-gray-800/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-600 h-full">
												<CardHeader>
													<div className="flex items-center justify-between mb-4">
														<div
															className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${getGameGradient(
																index
															)} rounded-2xl shadow-lg transform hover:rotate-6 transition-transform`}
														>
															{getGameIcon(gameType)}
														</div>
														<Badge
															variant="secondary"
															className="bg-green-500/20 text-green-400 border-green-500/30"
														>
															<Zap className="w-3 h-3 mr-1" />
															Quick game
														</Badge>
													</div>
													<CardTitle className="text-2xl text-white mb-2 font-bold">
														{gameInfo.name}
													</CardTitle>
													<CardDescription className="text-gray-300 text-sm">
														{gameInfo.description}
													</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="flex items-center space-x-4 text-sm">
														<div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-lg">
															<Users className="w-4 h-4 text-blue-400" />
															<span className="text-white font-medium">
																{gameInfo.minPlayers}-{gameInfo.maxPlayers}{' '}
																players
															</span>
														</div>
														<div className="text-3xl">{gameInfo.icon}</div>
													</div>
												</CardContent>
												<CardFooter>
													<Button
														onClick={() => startGame(gameType)}
														className={`w-full bg-gradient-to-r ${getGameGradient(
															index
														)} hover:opacity-90 text-white font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-200`}
													>
														<Play className="w-5 h-5 mr-2" />
														Start game
													</Button>
												</CardFooter>
											</Card>
										</div>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white -left-12" />
							<CarouselNext className="bg-gray-800/90 border-gray-700 text-white hover:bg-gray-700 hover:text-white -right-12" />
						</Carousel>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-20 space-y-24">
				{/* How Mobile Controller Works - Detailed */}
				<div className="space-y-12">
					<div className="text-center space-y-4">
						<Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-6 py-3 text-base">
							<Smartphone className="w-5 h-5 mr-2" />
							Mobile controller system
						</Badge>
						<h2 className="text-5xl font-bold text-white">
							Your smartphone is your gamepad
						</h2>
						<p className="text-gray-300 text-xl max-w-3xl mx-auto">
							Revolutionary technology turns any smartphone into a full-fledged
							game controller without installing apps
						</p>
					</div>

					{/* Step-by-step visual guide */}
					<div className="grid md:grid-cols-3 gap-8">
						<div className="relative">
							<div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-300 h-full">
								<div className="absolute -top-6 left-8 bg-gradient-to-r from-green-500 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
									1
								</div>
								<Monitor className="w-16 h-16 text-green-400 mb-6 mt-4" />
								<h3 className="text-2xl font-bold text-white mb-4">
									Open game on a screen
								</h3>
								<p className="text-gray-300 text-base leading-relaxed">
									Launch any game on your TV, monitor, or projector. The system
									will automatically create a unique game room and generate a QR
									code for connection.
								</p>
								<div className="mt-6 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
									<div className="text-sm text-gray-400 mb-2">Supported:</div>
									<div className="flex flex-wrap gap-2">
										<Badge className="bg-gray-800 text-gray-300">
											Smart TV
										</Badge>
										<Badge className="bg-gray-800 text-gray-300">
											Computer
										</Badge>
										<Badge className="bg-gray-800 text-gray-300">
											Projector
										</Badge>
									</div>
								</div>
							</div>
						</div>

						<div className="relative">
							<div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-2 border-blue-500/30 rounded-3xl p-8 hover:border-blue-400/50 transition-all duration-300 h-full">
								<div className="absolute -top-6 left-8 bg-gradient-to-r from-blue-500 to-cyan-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
									2
								</div>
								<QrCode className="w-16 h-16 text-blue-400 mb-6 mt-4" />
								<h3 className="text-2xl font-bold text-white mb-4">
									Scan the QR code
								</h3>
								<p className="text-gray-300 text-base leading-relaxed">
									Open the camera on your smartphone and point it at the QR
									code. The browser will automatically open the controller. No
									apps, no registrations—everything works through the web
									browser!
								</p>
								<div className="mt-6 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
									<div className="text-sm text-gray-400 mb-2">
										Works on any phone:
									</div>
									<div className="flex flex-wrap gap-2">
										<Badge className="bg-gray-800 text-gray-300">iPhone</Badge>
										<Badge className="bg-gray-800 text-gray-300">Android</Badge>
										<Badge className="bg-gray-800 text-gray-300">
											Any browser
										</Badge>
									</div>
								</div>
							</div>
						</div>

						<div className="relative">
							<div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/30 rounded-3xl p-8 hover:border-purple-400/50 transition-all duration-300 h-full">
								<div className="absolute -top-6 left-8 bg-gradient-to-r from-purple-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
									3
								</div>
								<Smartphone className="w-16 h-16 text-purple-400 mb-6 mt-4" />
								<h3 className="text-2xl font-bold text-white mb-4">
									Play from your phone!
								</h3>
								<p className="text-gray-300 text-base leading-relaxed">
									Your smartphone turns into a full-fledged gamepad with
									joysticks, action buttons, and adaptive interface. Control
									your character and compete with friends!
								</p>
								<div className="mt-6 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
									<div className="text-sm text-gray-400 mb-2">
										Instant response:
									</div>
									<div className="flex items-center space-x-2">
										<Wifi className="w-4 h-4 text-green-400" />
										<span className="text-green-400 font-semibold">
											{'<'}20ms latency
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Mobile Controller Technology Deep Dive */}
				<div className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>
					<Card className="relative bg-gray-800/80 border-gray-700 backdrop-blur-xl overflow-hidden">
						<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
						<CardHeader className="relative">
							<div className="flex items-center justify-center mb-6">
								<div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-2xl">
									<Gamepad2 className="w-12 h-12 text-white" />
								</div>
							</div>
							<CardTitle className="text-4xl text-white text-center font-bold mb-4">
								How does mobile controller technology work?
							</CardTitle>
							<CardDescription className="text-gray-300 text-center text-lg">
								Revolutionary control system without apps
							</CardDescription>
						</CardHeader>
						<CardContent className="relative space-y-8">
							{/* Technology breakdown */}
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
									<div className="flex items-start space-x-4">
										<div className="bg-blue-500/20 p-3 rounded-xl">
											<Wifi className="w-6 h-6 text-blue-400" />
										</div>
										<div>
											<h4 className="text-lg font-bold text-white mb-2">
												WebSocket Real-Time
											</h4>
											<p className="text-gray-400 text-sm leading-relaxed">
												We use WebSocket for instant data transmission between
												phone and screen. Every button press is transmitted in
												milliseconds without delay.
											</p>
										</div>
									</div>
								</div>

								<div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
									<div className="flex items-start space-x-4">
										<div className="bg-green-500/20 p-3 rounded-xl">
											<QrCode className="w-6 h-6 text-green-400" />
										</div>
										<div>
											<h4 className="text-lg font-bold text-white mb-2">
												Instant connection
											</h4>
											<p className="text-gray-400 text-sm leading-relaxed">
												The QR code contains a unique room ID. Scanning
												automatically connects your phone to the game via the
												local network.
											</p>
										</div>
									</div>
								</div>

								<div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
									<div className="flex items-start space-x-4">
										<div className="bg-purple-500/20 p-3 rounded-xl">
											<Smartphone className="w-6 h-6 text-purple-400" />
										</div>
										<div>
											<h4 className="text-lg font-bold text-white mb-2">
												Adaptive interface
											</h4>
											<p className="text-gray-400 text-sm leading-relaxed">
												The controller interface automatically adapts to the
												game type: joysticks for shooter, gas/brake buttons for
												racing, tower menu for tower defence.
											</p>
										</div>
									</div>
								</div>

								<div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
									<div className="flex items-start space-x-4">
										<div className="bg-orange-500/20 p-3 rounded-xl">
											<Shield className="w-6 h-6 text-orange-400" />
										</div>
										<div>
											<h4 className="text-lg font-bold text-white mb-2">
												Local network
											</h4>
											<p className="text-gray-400 text-sm leading-relaxed">
												All data stays in your local network. No data is sent to
												external servers—complete privacy and security.
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Visual diagram */}
							<div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-2xl p-8 border border-gray-700">
								<div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
									<div className="flex-1 text-center">
										<div className="bg-gray-700 p-6 rounded-2xl inline-block mb-4">
											<Monitor className="w-16 h-16 text-blue-400 mx-auto mb-2" />
											<div className="text-white font-bold">Game screen</div>
											<div className="text-gray-400 text-sm">TV / Monitor</div>
										</div>
									</div>

									<div className="flex items-center">
										<div className="flex flex-col items-center">
											<ArrowRight className="w-8 h-8 text-green-400 mb-2 animate-pulse" />
											<div className="text-center">
												<div className="text-green-400 font-bold text-sm">
													WebSocket
												</div>
												<div className="text-gray-400 text-xs">{'<'}20ms</div>
											</div>
											<ArrowRight className="w-8 h-8 text-green-400 mt-2 rotate-180 animate-pulse" />
										</div>
									</div>

									<div className="flex-1 text-center">
										<div className="bg-gray-700 p-6 rounded-2xl inline-block mb-4">
											<Smartphone className="w-16 h-16 text-purple-400 mx-auto mb-2" />
											<div className="text-white font-bold">Controller</div>
											<div className="text-gray-400 text-sm">
												iPhone / Android
											</div>
										</div>
									</div>
								</div>

								<div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
									<div className="bg-gray-800/50 rounded-xl p-4">
										<div className="text-2xl font-bold text-green-400 mb-1">
											60 FPS
										</div>
										<div className="text-gray-400 text-sm">Update rate</div>
									</div>
									<div className="bg-gray-800/50 rounded-xl p-4">
										<div className="text-2xl font-bold text-blue-400 mb-1">
											10+ players
										</div>
										<div className="text-gray-400 text-sm">Simultaneously</div>
									</div>
									<div className="bg-gray-800/50 rounded-xl p-4">
										<div className="text-2xl font-bold text-purple-400 mb-1">
											0 installs
										</div>
										<div className="text-gray-400 text-sm">
											Works in browser
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Controller Features */}
				<div className="space-y-12">
					<div className="text-center space-y-4">
						<h2 className="text-4xl font-bold text-white">
							Controller capabilities
						</h2>
						<p className="text-gray-300 text-lg max-w-2xl mx-auto">
							Each game has a unique control interface optimized for mobile
							devices
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6">
						{/* Shooter Controller */}
						<Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-700/50 backdrop-blur-lg hover:scale-105 transition-all duration-300">
							<CardHeader>
								<Target className="w-12 h-12 text-red-400 mb-4" />
								<CardTitle className="text-xl text-white font-bold">
									Battle Arena
								</CardTitle>
								<CardDescription className="text-gray-300">
									Shooter controller
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-gray-300">
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Virtual joystick for movement</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Aiming joystick</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Fire button</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Real-time statistics</span>
								</div>
							</CardContent>
						</Card>

						{/* Race Controller */}
						<Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50 backdrop-blur-lg hover:scale-105 transition-all duration-300">
							<CardHeader>
								<Car className="w-12 h-12 text-blue-400 mb-4" />
								<CardTitle className="text-xl text-white font-bold">
									Race Track
								</CardTitle>
								<CardDescription className="text-gray-300">
									Racing controller
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-gray-300">
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Gas and brake pedals</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Left/right turn buttons</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Speed indicator</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Leaderboard</span>
								</div>
							</CardContent>
						</Card>

						{/* Tower Defence Controller */}
						<Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700/50 backdrop-blur-lg hover:scale-105 transition-all duration-300">
							<CardHeader>
								<Castle className="w-12 h-12 text-yellow-400 mb-4" />
								<CardTitle className="text-xl text-white font-bold">
									Tower Defence
								</CardTitle>
								<CardDescription className="text-gray-300">
									Strategic controller
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-gray-300">
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Tower type selection</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Tower upgrade and sale</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Wave management</span>
								</div>
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-green-400" />
									<span>Resource statistics</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Key Features */}
				<div className="space-y-12">
					<div className="text-center space-y-4">
						<h2 className="text-4xl font-bold text-white">Why choose us?</h2>
						<p className="text-gray-300 text-lg max-w-2xl mx-auto">
							Technical advantages of the One Screen Games platform
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-green-500/20 p-3 rounded-xl w-fit mb-4">
									<Sparkles className="w-8 h-8 text-green-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Zero installation
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Works right in the browser. No apps, no app stores, no
								permissions. Just open the link and play.
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-4">
									<Users className="w-8 h-8 text-blue-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Up to 10 players
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Support for multiple players simultaneously. Each with unique
								color, name, and individual controller. Perfect for parties!
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-purple-500/20 p-3 rounded-xl w-fit mb-4">
									<Zap className="w-8 h-8 text-purple-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Instant response
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Latency less than 20 milliseconds thanks to WebSocket and local
								network. Controls are as responsive as a real gamepad.
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-cyan-500/20 p-3 rounded-xl w-fit mb-4">
									<Heart className="w-8 h-8 text-cyan-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Free
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Completely free platform. No subscriptions, no in-app purchases,
								no hidden fees. Just fun!
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-pink-500/20 p-3 rounded-xl w-fit mb-4">
									<Trophy className="w-8 h-8 text-pink-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Different genres
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Shooters, racing, strategies—each game with unique mechanics and
								control style. New games are constantly being added!
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg hover:bg-gray-800/70 transition-all">
							<CardHeader>
								<div className="bg-orange-500/20 p-3 rounded-xl w-fit mb-4">
									<Shield className="w-8 h-8 text-orange-400" />
								</div>
								<CardTitle className="text-xl text-white font-bold">
									Privacy
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300">
								Games work in your local network. No data leaves your network.
								Full control over privacy.
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Use Cases */}
				<div className="space-y-12">
					<div className="text-center space-y-4">
						<h2 className="text-4xl font-bold text-white">
							Who is this perfect for?
						</h2>
					</div>

					<div className="grid md:grid-cols-2 gap-8">
						<Card className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-pink-700/50 backdrop-blur-lg">
							<CardHeader>
								<CardTitle className="text-2xl text-white font-bold flex items-center">
									<span className="text-3xl mr-3">🎉</span>
									Parties and events
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 space-y-3">
								<p>
									Turn any party into an unforgettable event! Guests connect
									instantly—just scan the QR code and start playing.
								</p>
								<ul className="space-y-2 text-sm">
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>
											No need to hand out controllers or explain controls
										</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Players can join and leave at any time</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Support for up to 10 players simultaneously</span>
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50 backdrop-blur-lg">
							<CardHeader>
								<CardTitle className="text-2xl text-white font-bold flex items-center">
									<span className="text-3xl mr-3">🏢</span>
									Corporate events
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 space-y-3">
								<p>
									Perfect solution for team building, conference breaks, and
									corporate events.
								</p>
								<ul className="space-y-2 text-sm">
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Quick launch without technical preparation</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Works on corporate equipment</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Data stays in the company's local network</span>
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700/50 backdrop-blur-lg">
							<CardHeader>
								<CardTitle className="text-2xl text-white font-bold flex items-center">
									<span className="text-3xl mr-3">👨‍👩‍👧‍👦</span>
									Family games
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 space-y-3">
								<p>
									Bring the family together for an exciting game! Simple
									controls are clear even to children and grandmas.
								</p>
								<ul className="space-y-2 text-sm">
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Intuitive controllers</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Play from any device in the house</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Safe for children</span>
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-700/50 backdrop-blur-lg">
							<CardHeader>
								<CardTitle className="text-2xl text-white font-bold flex items-center">
									<span className="text-3xl mr-3">🎪</span>
									Interactive zones
								</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-300 space-y-3">
								<p>
									Create a gaming zone at an event, cafe, or shopping center.
									Visitors play without registration!
								</p>
								<ul className="space-y-2 text-sm">
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Instant connection via QR</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>No administration required</span>
									</li>
									<li className="flex items-start">
										<CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
										<span>Scales to large screens</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Final CTA */}
				<div className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>
					<Card className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700 backdrop-blur-xl overflow-hidden">
						<div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
						<CardContent className="relative py-16 text-center space-y-8">
							<div className="space-y-4">
								<h2 className="text-5xl font-bold text-white">
									Ready to start playing?
								</h2>
								<p className="text-gray-300 text-xl max-w-3xl mx-auto">
									Choose a game above and turn any screen into a gaming arena in
									seconds!
								</p>
							</div>

							<div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
								<Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-8 py-4 text-base">
									<CheckCircle2 className="w-5 h-5 mr-2" />
									No app installation
								</Badge>
								<Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-8 py-4 text-base">
									<CheckCircle2 className="w-5 h-5 mr-2" />
									Free forever
								</Badge>
								<Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-8 py-4 text-base">
									<CheckCircle2 className="w-5 h-5 mr-2" />
									Up to 10 players
								</Badge>
							</div>

							<div className="pt-8">
								<Button
									onClick={() => {
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}}
									className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:opacity-90 text-white font-bold py-6 px-12 text-xl shadow-2xl hover:shadow-3xl transition-all duration-200 rounded-xl"
								>
									<Play className="w-6 h-6 mr-3" />
									Choose game
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Footer */}
				<div className="text-center py-12 border-t border-gray-700/50">
					<div className="space-y-4">
						<div className="flex items-center justify-center space-x-2 text-gray-400">
							<Gamepad2 className="w-5 h-5" />
							<span className="font-medium">One Screen Games</span>
						</div>
						<p className="text-gray-500 text-sm">
							Технологии: React, Next.js, PixiJS, Socket.IO, TypeScript
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
