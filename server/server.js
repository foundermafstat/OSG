import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameRoomManager } from './gameRoomManager.js';
import { GAME_TYPES, GAME_INFO } from './games/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});

const PORT = process.env.PORT || 3001;

// CORS middleware for Express routes
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept'
	);
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// Инициализируем менеджер игровых комнат
const roomManager = new GameRoomManager();

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoints
app.get('/api/games', (req, res) => {
	res.json(GAME_INFO);
});

app.get('/api/rooms', (req, res) => {
	const rooms = roomManager.getActiveRooms();
	res.json(rooms);
});

// Socket handling
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Создать новую комнату
	socket.on('createRoom', ({ gameType, roomId, config }) => {
		try {
			const game = roomManager.createRoom(roomId, gameType, config);

			// Add the game screen socket to the room so it receives gameState
			const room = roomManager.getRoom(roomId);
			if (room) {
				room.sockets.add(socket);
				// Also track this socket-room relationship
				roomManager.playerToRoom.set(socket.id, roomId);
			}

			socket.emit('roomCreated', {
				roomId,
				gameType,
				gameInfo: game.getGameInfo(),
			});
			console.log(
				`Room ${roomId} created with type ${gameType}, screen connected`
			);
		} catch (error) {
			socket.emit('error', { message: error.message });
			console.error('Error creating room:', error);
		}
	});

	// Присоединиться к комнате
	socket.on('joinRoom', ({ roomId, playerName }) => {
		try {
			const { room, playerData } = roomManager.joinRoom(
				roomId,
				socket,
				playerName
			);

			// Отправляем подтверждение присоединившемуся игроку
			socket.emit('playerJoined', {
				playerId: socket.id,
				roomId,
				gameType: room.game.gameType,
				playerData,
				gameConfig: room.game.config,
			});

			// Уведомляем всех в комнате о новом игроке
			roomManager.broadcastToRoom(roomId, 'playerConnected', playerData);

			console.log(`Player ${playerName} joined room ${roomId}`);
		} catch (error) {
			socket.emit('error', { message: error.message });
			console.error('Error joining room:', error);
		}
	});

	// Получить размеры экрана
	socket.on('screenDimensions', (dimensions) => {
		try {
			const newDimensions = roomManager.handleScreenDimensions(
				socket.id,
				dimensions
			);
			if (newDimensions) {
				console.log(
					`Updated world dimensions: ${newDimensions.width}x${newDimensions.height}`
				);
			}
		} catch (error) {
			console.error('Error updating screen dimensions:', error);
		}
	});

	// Обработка ввода игрока
	socket.on('playerInput', (input) => {
		try {
			roomManager.handlePlayerInput(socket.id, input);
		} catch (error) {
			console.error('Error handling player input:', error);
		}
	});

	// Обработка прицеливания (для шутера)
	socket.on('playerAim', (direction) => {
		try {
			roomManager.handlePlayerAim(socket.id, direction);
		} catch (error) {
			console.error('Error handling player aim:', error);
		}
	});

	// Обработка выстрела (для шутера)
	socket.on('playerShoot', () => {
		try {
			const bullet = roomManager.handlePlayerShoot(socket.id);
			if (bullet) {
				const room = roomManager.getRoomByPlayerId(socket.id);
				if (room) {
					const player = room.game.players.get(socket.id);
					console.log(`Player ${player?.name || socket.id} shot bullet`);
				}
			}
		} catch (error) {
			console.error('Error handling player shoot:', error);
		}
	});

	// Отключение
	socket.on('disconnect', () => {
		try {
			const roomId = roomManager.leaveRoom(socket.id);
			if (roomId) {
				roomManager.broadcastToRoom(roomId, 'playerDisconnected', socket.id);
				console.log(`Player ${socket.id} disconnected from room ${roomId}`);
			}
		} catch (error) {
			console.error('Error handling disconnect:', error);
		}
	});
});

server.listen(PORT, () => {
	console.log(`OSG server running on port ${PORT}`);
	console.log(`Available game types:`, Object.keys(GAME_TYPES));
});
