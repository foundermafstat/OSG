import { createGame, GAME_TYPES } from './games/index.js';

// Менеджер игровых комнат
export class GameRoomManager {
	constructor() {
		this.rooms = new Map(); // roomId -> { game, sockets: Set() }
		this.playerToRoom = new Map(); // playerId -> roomId
		this.gameLoops = new Map(); // roomId -> intervalId
	}

	// Создать новую игровую комнату
	createRoom(roomId, gameType, config = {}) {
		if (this.rooms.has(roomId)) {
			throw new Error(`Room ${roomId} already exists`);
		}

		const game = createGame(gameType, roomId, config);
		this.rooms.set(roomId, {
			game,
			sockets: new Set(),
			createdAt: Date.now(),
		});

		// Запустить игровой цикл для этой комнаты
		this.startGameLoop(roomId);

		console.log(`Created room ${roomId} with game type ${gameType}`);
		return game;
	}

	// Получить игру по ID комнаты
	getRoom(roomId) {
		return this.rooms.get(roomId);
	}

	// Присоединить игрока к комнате
	joinRoom(roomId, socket, playerName) {
		const room = this.rooms.get(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} not found`);
		}

		// Добавляем сокет в комнату
		room.sockets.add(socket);
		this.playerToRoom.set(socket.id, roomId);

		// Добавляем игрока в игру
		const playerData = room.game.addPlayer(socket.id, playerName);

		console.log(`Player ${playerName} (${socket.id}) joined room ${roomId}`);
		return { room, playerData };
	}

	// Покинуть комнату
	leaveRoom(socketId) {
		const roomId = this.playerToRoom.get(socketId);
		if (!roomId) return null;

		const room = this.rooms.get(roomId);
		if (!room) return null;

		// Удаляем игрока из игры
		room.game.removePlayer(socketId);

		// Удаляем сокет из комнаты
		room.sockets.forEach((s) => {
			if (s.id === socketId) {
				room.sockets.delete(s);
			}
		});

		this.playerToRoom.delete(socketId);

		// Если комната пустая, закрываем её
		if (room.sockets.size === 0) {
			this.closeRoom(roomId);
		}

		console.log(`Player ${socketId} left room ${roomId}`);
		return roomId;
	}

	// Закрыть комнату
	closeRoom(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		// Останавливаем игровой цикл
		this.stopGameLoop(roomId);

		// Удаляем комнату
		this.rooms.delete(roomId);

		console.log(`Closed room ${roomId}`);
	}

	// Запустить игровой цикл для комнаты
	startGameLoop(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		let lastUpdate = Date.now();
		const intervalId = setInterval(() => {
			const now = Date.now();
			const deltaTime = (now - lastUpdate) / 1000;
			lastUpdate = now;

			// Обновляем состояние игры
			room.game.update(deltaTime);

			// Отправляем состояние всем игрокам в комнате
			const gameState = room.game.getGameState();
			room.sockets.forEach((socket) => {
				socket.emit('gameState', gameState);
			});
		}, 1000 / 60); // 60 FPS

		this.gameLoops.set(roomId, intervalId);
	}

	// Остановить игровой цикл для комнаты
	stopGameLoop(roomId) {
		const intervalId = this.gameLoops.get(roomId);
		if (intervalId) {
			clearInterval(intervalId);
			this.gameLoops.delete(roomId);
		}
	}

	// Получить комнату по ID игрока
	getRoomByPlayerId(playerId) {
		const roomId = this.playerToRoom.get(playerId);
		return roomId ? this.rooms.get(roomId) : null;
	}

	// Получить список всех активных комнат
	getActiveRooms() {
		const rooms = [];
		for (const [roomId, room] of this.rooms) {
			rooms.push({
				roomId,
				gameType: room.game.gameType,
				playerCount: room.game.players.size,
				createdAt: room.createdAt,
			});
		}
		return rooms;
	}

	// Обработать ввод игрока
	handlePlayerInput(socketId, input) {
		const room = this.getRoomByPlayerId(socketId);
		if (!room) return;

		room.game.handlePlayerInput(socketId, input);
	}

	// Обработать прицеливание игрока (для шутера)
	handlePlayerAim(socketId, direction) {
		const room = this.getRoomByPlayerId(socketId);
		if (!room || !room.game.handlePlayerAim) return;

		room.game.handlePlayerAim(socketId, direction);
	}

	// Обработать выстрел игрока (для шутера)
	handlePlayerShoot(socketId) {
		const room = this.getRoomByPlayerId(socketId);
		if (!room || !room.game.handlePlayerShoot) return;

		const bullet = room.game.handlePlayerShoot(socketId);
		return bullet;
	}

	// Обновить размеры мира
	handleScreenDimensions(socketId, dimensions) {
		const room = this.getRoomByPlayerId(socketId);
		if (!room || !room.game.updateWorldSize) return;

		const newDimensions = room.game.updateWorldSize(
			dimensions.width,
			dimensions.height
		);

		// Отправляем обновлённые размеры всем в комнате
		room.sockets.forEach((socket) => {
			socket.emit('worldDimensions', newDimensions);
		});

		return newDimensions;
	}

	// Отправить событие всем игрокам в комнате
	broadcastToRoom(roomId, event, data) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		room.sockets.forEach((socket) => {
			socket.emit(event, data);
		});
	}
}
