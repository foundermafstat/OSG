// Базовый класс игры
export class BaseGame {
	constructor(gameId, config = {}) {
		this.gameId = gameId;
		this.gameType = 'base';
		this.players = new Map();
		this.config = config;
		this.state = {};
		this.lastUpdate = Date.now();
	}

	// Добавить игрока
	addPlayer(playerId, playerName) {
		throw new Error('Method addPlayer must be implemented');
	}

	// Удалить игрока
	removePlayer(playerId) {
		this.players.delete(playerId);
		return true;
	}

	// Обработать входящие данные от игрока
	handlePlayerInput(playerId, input) {
		throw new Error('Method handlePlayerInput must be implemented');
	}

	// Обновить игровое состояние
	update(deltaTime) {
		throw new Error('Method update must be implemented');
	}

	// Получить игровое состояние для отправки клиенту
	getGameState() {
		throw new Error('Method getGameState must be implemented');
	}

	// Получить информацию об игре
	getGameInfo() {
		return {
			gameId: this.gameId,
			gameType: this.gameType,
			playerCount: this.players.size,
			config: this.config,
		};
	}
}
