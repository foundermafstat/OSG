import { ShooterGame } from './shooterGame.js';
import { RaceGame } from './raceGame.js';
import { TowerDefenceGame } from './towerDefenceGame.js';
import { QuizGame } from './quizGame.js';

// Реестр доступных игр
export const GAME_TYPES = {
	SHOOTER: 'shooter',
	RACE: 'race',
	TOWERDEFENCE: 'towerdefence',
	QUIZ: 'quiz',
};

// Фабрика для создания игр
export function createGame(gameType, gameId, config = {}) {
	switch (gameType) {
		case GAME_TYPES.SHOOTER:
			return new ShooterGame(gameId, config);
		case GAME_TYPES.RACE:
			return new RaceGame(gameId, config);
		case GAME_TYPES.TOWERDEFENCE:
			return new TowerDefenceGame(gameId, config);
		case GAME_TYPES.QUIZ:
			return new QuizGame(gameId, config);
		default:
			throw new Error(`Unknown game type: ${gameType}`);
	}
}

// Available games information
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
		description: 'Competitive racing game with checkpoints and obstacles',
		minPlayers: 1,
		maxPlayers: 8,
		icon: '🏎️',
	},
	[GAME_TYPES.TOWERDEFENCE]: {
		id: GAME_TYPES.TOWERDEFENCE,
		name: 'Tower Defence',
		description:
			'Defend your castle from waves of enemies with strategic tower placement',
		minPlayers: 1,
		maxPlayers: 4,
		icon: '🏰',
	},
	[GAME_TYPES.QUIZ]: {
		id: GAME_TYPES.QUIZ,
		name: 'Quiz Battle',
		description:
			'Test your knowledge in a multiplayer quiz game with time pressure',
		minPlayers: 2,
		maxPlayers: 8,
		icon: '🧠',
	},
};
