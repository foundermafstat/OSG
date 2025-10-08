'use client';

import React, { use, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GameScreen from '@/components/GameScreen';
import MobileController from '@/components/MobileController';
import RaceGameScreen from '@/components/RaceGameScreen';
import RaceMobileController from '@/components/RaceMobileController';

interface PageProps {
	params: Promise<{ gameType: string }>;
}

export default function GamePage({ params }: PageProps) {
	const resolvedParams = use(params);
	const searchParams = useSearchParams();
	const [currentView, setCurrentView] = useState<'game' | 'controller'>('game');
	const [roomId, setRoomId] = useState<string>('');

	useEffect(() => {
		// Check URL for controller mode
		const mode = searchParams.get('mode');
		const id = searchParams.get('roomId');

		if (id) {
			setRoomId(id);
			if (mode === 'controller') {
				setCurrentView('controller');
			}
		} else {
			// Generate new roomId if not specified
			const newRoomId = Math.random().toString(36).substring(2, 8);
			setRoomId(newRoomId);
		}
	}, [searchParams]);

	if (!roomId) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-xl">Initializing...</div>
			</div>
		);
	}

	// Select components based on game type
	const getGameComponents = () => {
		console.log('Game type:', resolvedParams.gameType);
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
				console.warn('Unknown game type, using shooter as default');
				return {
					GameComponent: GameScreen,
					ControllerComponent: MobileController,
				};
		}
	};

	const { GameComponent, ControllerComponent } = getGameComponents();

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
