import { ShooterGame } from './shooterGame.js';
import { RaceGame } from './raceGame.js';

// Реестр доступных игр
export const GAME_TYPES = {
	SHOOTER: 'shooter',
	RACE: 'race',
};

// Фабрика для создания игр
export function createGame(gameType, gameId, config = {}) {
	switch (gameType) {
		case GAME_TYPES.SHOOTER:
			return new ShooterGame(gameId, config);
		case GAME_TYPES.RACE:
			return new RaceGame(gameId, config);
		default:
			throw new Error(`Unknown game type: ${gameType}`);
	}
}

// Информация о доступных играх
export const GAME_INFO = {
	[GAME_TYPES.SHOOTER]: {
		id: GAME_TYPES.SHOOTER,
		name: 'Battle Arena',
		description: 'Multiplayer top-down shooter with bots and power-ups',
		minPlayers: 1,
		maxPlayers: 10,
		icon: '🎯',
	},
	[GAME_TYPES.RACE]: {
		id: GAME_TYPES.RACE,
		name: 'Race Track',
		description: 'Competitive racing game with checkpoints',
		minPlayers: 1,
		maxPlayers: 8,
		icon: '🏎️',
	},
};
