'use client';

import React, { use, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues
const GameScreen = dynamic(() => import('@/components/GameScreen'), {
	ssr: false,
	loading: () => (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center">
			<div className="text-white text-xl">Loading game...</div>
		</div>
	),
});

const MobileController = dynamic(
	() => import('@/components/MobileController'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading controller...</div>
			</div>
		),
	}
);

const RaceGameScreen = dynamic(() => import('@/components/RaceGameScreen'), {
	ssr: false,
	loading: () => (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center">
			<div className="text-white text-xl">Loading race...</div>
		</div>
	),
});

const RaceMobileController = dynamic(
	() => import('@/components/RaceMobileController'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Loading controller...</div>
			</div>
		),
	}
);

interface PageProps {
	params: Promise<{ gameType: string }>;
}

export default function GamePage({ params }: PageProps) {
	const resolvedParams = use(params);
	const searchParams = useSearchParams();
	const [currentView, setCurrentView] = useState<'game' | 'controller'>('game');
	const [roomId, setRoomId] = useState<string>('');
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		console.log(
			'[GamePage] Initializing with gameType:',
			resolvedParams.gameType
		);

		// Check URL for controller mode
		const mode = searchParams.get('mode');
		const id = searchParams.get('roomId');

		console.log('[GamePage] URL params:', { mode, roomId: id });

		if (id) {
			setRoomId(id);
			if (mode === 'controller') {
				setCurrentView('controller');
			}
		} else {
			// Generate new roomId if not specified
			const newRoomId = Math.random().toString(36).substring(2, 8);
			console.log('[GamePage] Generated new roomId:', newRoomId);
			setRoomId(newRoomId);
		}

		setIsInitialized(true);
	}, [searchParams, resolvedParams.gameType]);

	if (!isInitialized || !roomId) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
					<div className="text-white text-xl">Initializing...</div>
				</div>
			</div>
		);
	}

	// Select components based on game type
	const getGameComponents = () => {
		console.log('[GamePage] Getting components for:', resolvedParams.gameType);
		switch (resolvedParams.gameType) {
			case 'shooter':
				return {
					GameComponent: GameScreen,
					ControllerComponent: MobileController,
				};
			case 'race':
				return {
					GameComponent: RaceGameScreen,
					ControllerComponent: RaceMobileController,
				};
			default:
				console.warn(
					'[GamePage] Unknown game type, using shooter as default:',
					resolvedParams.gameType
				);
				return {
					GameComponent: GameScreen,
					ControllerComponent: MobileController,
				};
		}
	};

	const { GameComponent, ControllerComponent } = getGameComponents();

	console.log('[GamePage] Rendering view:', currentView, 'for game:', roomId);

	if (currentView === 'controller') {
		return (
			<ControllerComponent gameId={roomId} gameType={resolvedParams.gameType} />
		);
	}

	return (
		<GameComponent
			gameId={roomId}
			gameType={resolvedParams.gameType}
			onBack={() => (window.location.href = '/')}
		/>
	);
}
