import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Game state
const gameState = {
	players: new Map(),
	bullets: [],
	bots: [],
	obstacles: [
		{ x: 200, y: 150, width: 100, height: 20, type: 'wall' },
		// { x: 500, y: 300, width: 150, height: 20, type: 'wall' },
		// { x: 300, y: 450, width: 200, height: 20, type: 'wall' },
		// { x: 700, y: 200, width: 80, height: 100, type: 'wall' },
		// { x: 100, y: 350, width: 120, height: 80, type: 'wall' }
	],
	interactiveObjects: [
		{
			id: 'teleporter1',
			x: 150,
			y: 100,
			width: 40,
			height: 40,
			type: 'teleporter',
			targetId: 'teleporter2',
			cooldown: 0,
		},
		{
			id: 'teleporter2',
			x: 900,
			y: 600,
			width: 40,
			height: 40,
			type: 'teleporter',
			targetId: 'teleporter1',
			cooldown: 0,
		},
		{
			id: 'speedBoost1',
			x: 400,
			y: 200,
			width: 30,
			height: 30,
			type: 'speedBoost',
			active: true,
			respawnTime: 0,
		},
		{
			id: 'speedBoost2',
			x: 800,
			y: 500,
			width: 30,
			height: 30,
			type: 'speedBoost',
			active: true,
			respawnTime: 0,
		},
		{
			id: 'shield1',
			x: 600,
			y: 100,
			width: 35,
			height: 35,
			type: 'shield',
			active: true,
			respawnTime: 0,
		},
		{ id: 'bouncer1', x: 350, y: 350, width: 50, height: 50, type: 'bouncer' },
		{ id: 'bouncer2', x: 750, y: 250, width: 50, height: 50, type: 'bouncer' },
	],
};

// Bot spawn points
const botSpawnPoints = [
	{ x: 200, y: 200 },
	{ x: 1000, y: 400 },
	{ x: 600, y: 100 },
];

let botIdCounter = 0;

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Game logic - dynamic world size
const GAME_CONFIG = {
	WORLD_WIDTH: 1920, // Default, will be updated by clients
	WORLD_HEIGHT: 1080, // Default, will be updated by clients
	PLAYER_SIZE: 30,
	PLAYER_SPEED: 200,
	BULLET_SPEED: 400,
	BULLET_SIZE: 6,
	RESPAWN_DELAY: 2000,
};

// Store the largest screen dimensions from connected clients
let maxScreenWidth = GAME_CONFIG.WORLD_WIDTH;
let maxScreenHeight = GAME_CONFIG.WORLD_HEIGHT;

// Player colors pool
const PLAYER_COLORS = [
	'#ff6b6b',
	'#4ecdc4',
	'#45b7d1',
	'#96ceb4',
	'#feca57',
	'#ff9ff3',
	'#54a0ff',
	'#5f27cd',
	'#00d2d3',
	'#ff9f43',
	'#10ac84',
	'#ee5a24',
	'#0abde3',
	'#3867d6',
	'#8854d0',
];

let colorIndex = 0;

class Player {
	constructor(id, name) {
		this.id = id;
		this.name = name;
		// Spawn players in safe center area using dynamic world dimensions
		this.x =
			maxScreenWidth / 2 -
			GAME_CONFIG.PLAYER_SIZE / 2 +
			(Math.random() - 0.5) * 100;
		this.y =
			maxScreenHeight / 2 -
			GAME_CONFIG.PLAYER_SIZE / 2 +
			(Math.random() - 0.5) * 100;
		this.health = 100;
		this.alive = true;
		this.color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
		colorIndex++;
		this.lastShot = 0;
		this.kills = 0;
		this.deaths = 0;
		this.botKills = 0;

		// Direction and input system
		this.facingDirection = { x: 0, y: -1 }; // Default facing up
		this.aimDirection = { x: 0, y: -1 }; // Direction for shooting
		this.currentInput = { x: 0, y: 0 }; // Current movement input
		this.isMoving = false;

		this.effects = {
			speedBoost: { active: false, endTime: 0 },
			shield: { active: false, endTime: 0 },
		};
	}

	updateInput(input) {
		// Validate and normalize input
		const x = Math.max(-1, Math.min(1, parseFloat(input.x) || 0));
		const y = Math.max(-1, Math.min(1, parseFloat(input.y) || 0));

		this.currentInput = { x, y };

		// Check if player is actively moving
		const inputMagnitude = Math.sqrt(x * x + y * y);
		this.isMoving = inputMagnitude > 0.1;

		if (this.isMoving) {
			// Update facing direction when moving
			this.facingDirection = { x, y };

			// Update aim direction to match movement direction
			this.aimDirection = { x, y };

			console.log(
				`Player ${this.name} moving in direction (${x.toFixed(2)}, ${y.toFixed(
					2
				)}), aim updated to (${this.aimDirection.x.toFixed(
					2
				)}, ${this.aimDirection.y.toFixed(2)})`
			);
		}
		// If not moving, keep the last aim direction for shooting
	}

	// Set explicit aim direction (for future features like separate aim control)
	setAimDirection(direction) {
		const x = Math.max(-1, Math.min(1, parseFloat(direction.x) || 0));
		const y = Math.max(-1, Math.min(1, parseFloat(direction.y) || 0));

		const magnitude = Math.sqrt(x * x + y * y);
		if (magnitude > 0.1) {
			this.aimDirection = { x, y };
			console.log(
				`Player ${this.name} aim direction set to (${x.toFixed(2)}, ${y.toFixed(
					2
				)})`
			);
		}
	}

	move(deltaTime) {
		if (!this.alive) return;

		const speedMultiplier = this.effects.speedBoost.active ? 1.5 : 1;
		const speed = GAME_CONFIG.PLAYER_SPEED * speedMultiplier * deltaTime;

		// Calculate new position based on current input
		let newX = this.x + this.currentInput.x * speed;
		let newY = this.y + this.currentInput.y * speed;

		// Wraparound boundaries (seamless teleport to opposite side)
		const worldWidth = maxScreenWidth;
		const worldHeight = maxScreenHeight;

		if (newX < 0) {
			newX = worldWidth - GAME_CONFIG.PLAYER_SIZE;
		} else if (newX > worldWidth - GAME_CONFIG.PLAYER_SIZE) {
			newX = 0;
		}

		if (newY < 0) {
			newY = worldHeight - GAME_CONFIG.PLAYER_SIZE;
		} else if (newY > worldHeight - GAME_CONFIG.PLAYER_SIZE) {
			newY = 0;
		}

		// Obstacle collision
		const playerRect = {
			x: newX,
			y: newY,
			width: GAME_CONFIG.PLAYER_SIZE,
			height: GAME_CONFIG.PLAYER_SIZE,
		};

		let canMove = true;
		for (const obstacle of gameState.obstacles) {
			if (this.checkCollision(playerRect, obstacle)) {
				canMove = false;
				break;
			}
		}

		if (canMove) {
			this.x = newX;
			this.y = newY;

			// Check interactive object collisions
			this.checkInteractiveObjects();
		}
	}

	checkInteractiveObjects() {
		const playerRect = {
			x: this.x,
			y: this.y,
			width: GAME_CONFIG.PLAYER_SIZE,
			height: GAME_CONFIG.PLAYER_SIZE,
		};

		for (const obj of gameState.interactiveObjects) {
			if (this.checkCollision(playerRect, obj)) {
				this.handleObjectInteraction(obj);
			}
		}
	}

	handleObjectInteraction(obj) {
		const now = Date.now();

		switch (obj.type) {
			case 'teleporter':
				if (now > obj.cooldown) {
					const target = gameState.interactiveObjects.find(
						(o) => o.id === obj.targetId
					);
					if (target) {
						this.x = target.x;
						this.y = target.y;
						obj.cooldown = now + 1000; // 1 second cooldown
						target.cooldown = now + 1000;
					}
				}
				break;

			case 'speedBoost':
				if (obj.active) {
					this.effects.speedBoost = { active: true, endTime: now + 5000 };
					obj.active = false;
					obj.respawnTime = now + 10000; // Respawn after 10 seconds
				}
				break;

			case 'shield':
				if (obj.active) {
					this.effects.shield = { active: true, endTime: now + 8000 };
					obj.active = false;
					obj.respawnTime = now + 15000; // Respawn after 15 seconds
				}
				break;
		}
	}

	shoot() {
		const now = Date.now();
		if (!this.alive || now - this.lastShot < 300) return null; // Rate limit

		this.lastShot = now;

		// Use current aim direction for shooting
		let shootDirection = { ...this.aimDirection };

		// Ensure we have a valid direction
		const magnitude = Math.sqrt(
			shootDirection.x * shootDirection.x + shootDirection.y * shootDirection.y
		);
		if (magnitude < 0.1) {
			// If no aim direction is set, use facing direction
			shootDirection = { ...this.facingDirection };
			const facingMagnitude = Math.sqrt(
				shootDirection.x * shootDirection.x +
					shootDirection.y * shootDirection.y
			);
			if (facingMagnitude < 0.1) {
				// Default to shooting up if no direction is available
				shootDirection = { x: 0, y: -1 };
			}
		}

		// Normalize direction vector
		const length = Math.sqrt(
			shootDirection.x * shootDirection.x + shootDirection.y * shootDirection.y
		);
		const normalizedX = length > 0 ? shootDirection.x / length : 0;
		const normalizedY = length > 0 ? shootDirection.y / length : -1; // Default up if no direction

		console.log(
			`Player ${
				this.name
			} shooting: aim direction (${this.aimDirection.x.toFixed(
				2
			)}, ${this.aimDirection.y.toFixed(2)}), normalized (${normalizedX.toFixed(
				2
			)}, ${normalizedY.toFixed(2)})`
		);

		return {
			id: `bullet_${now}_${this.id}`,
			x: this.x + GAME_CONFIG.PLAYER_SIZE / 2,
			y: this.y + GAME_CONFIG.PLAYER_SIZE / 2,
			vx: normalizedX * GAME_CONFIG.BULLET_SPEED,
			vy: normalizedY * GAME_CONFIG.BULLET_SPEED,
			playerId: this.id,
			createdAt: now,
		};
	}

	takeDamage() {
		if (!this.alive) return false;

		// Check shield
		if (
			this.effects.shield.active &&
			Date.now() < this.effects.shield.endTime
		) {
			return false; // Damage blocked by shield
		}

		this.alive = false;
		this.deaths++;

		// Clear effects
		this.effects.speedBoost.active = false;
		this.effects.shield.active = false;

		// Respawn after delay
		setTimeout(() => {
			this.respawn();
		}, GAME_CONFIG.RESPAWN_DELAY);

		return true;
	}

	respawn() {
		this.alive = true;
		this.health = 100;
		// Respawn in center area using dynamic world dimensions
		this.x =
			maxScreenWidth / 2 -
			GAME_CONFIG.PLAYER_SIZE / 2 +
			(Math.random() - 0.5) * 100;
		this.y =
			maxScreenHeight / 2 -
			GAME_CONFIG.PLAYER_SIZE / 2 +
			(Math.random() - 0.5) * 100;

		// Reset direction to default
		this.facingDirection = { x: 0, y: -1 };
		this.aimDirection = { x: 0, y: -1 };
		this.currentInput = { x: 0, y: 0 };
		this.isMoving = false;
	}

	updateEffects() {
		const now = Date.now();

		if (
			this.effects.speedBoost.active &&
			now > this.effects.speedBoost.endTime
		) {
			this.effects.speedBoost.active = false;
		}

		if (this.effects.shield.active && now > this.effects.shield.endTime) {
			this.effects.shield.active = false;
		}
	}

	checkCollision(rect1, rect2) {
		return (
			rect1.x < rect2.x + rect2.width &&
			rect1.x + rect1.width > rect2.x &&
			rect1.y < rect2.y + rect2.height &&
			rect1.y + rect1.height > rect2.y
		);
	}

	// Get player data for client updates
	getPlayerData() {
		return {
			id: this.id,
			name: this.name,
			x: this.x,
			y: this.y,
			alive: this.alive,
			color: this.color,
			kills: this.kills,
			deaths: this.deaths,
			botKills: this.botKills || 0,
			health: this.health,
			effects: this.effects,
			facingDirection: this.facingDirection,
			aimDirection: this.aimDirection,
			isMoving: this.isMoving,
		};
	}
}

// Bot AI class
class Bot {
	constructor(spawnPoint) {
		this.id = `bot_${botIdCounter++}`;
		this.x = spawnPoint.x;
		this.y = spawnPoint.y;
		this.spawnPoint = spawnPoint;
		this.health = 2; // Dies in 2 hits
		this.alive = true;
		this.color = '#ff4444'; // Red color for bots
		this.size = 25;

		// AI behavior
		this.detectionRadius = 300; // Pixels to detect players
		this.speed = 150; // Slightly slower than players
		this.damagePerSecond = 25;
		this.lastDamageTime = 0;
		this.damageRadius = 35; // Distance to start damaging

		// Movement
		this.targetPlayer = null;
		this.wanderAngle = Math.random() * Math.PI * 2;
		this.wanderChangeTime = Date.now();
	}

	update(deltaTime) {
		if (!this.alive) return;

		const now = Date.now();

		// Find nearest player
		let nearestPlayer = null;
		let nearestDist = Infinity;

		for (const [, player] of gameState.players) {
			if (!player.alive) continue;

			const dx = player.x - this.x;
			const dy = player.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < nearestDist) {
				nearestDist = dist;
				nearestPlayer = player;
			}
		}

		// Behavior: Chase if player in range, otherwise wander
		if (nearestPlayer && nearestDist < this.detectionRadius) {
			// Chase player
			this.targetPlayer = nearestPlayer;
			const dx = nearestPlayer.x - this.x;
			const dy = nearestPlayer.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist > 0) {
				this.x += (dx / dist) * this.speed * deltaTime;
				this.y += (dy / dist) * this.speed * deltaTime;
			}

			// Damage player if close enough
			if (dist < this.damageRadius && now - this.lastDamageTime > 1000) {
				nearestPlayer.health -= this.damagePerSecond;
				this.lastDamageTime = now;

				if (nearestPlayer.health <= 0) {
					nearestPlayer.takeDamage(100, null);
				}
			}
		} else {
			// Wander randomly
			this.targetPlayer = null;

			// Change direction every 2-4 seconds
			if (now - this.wanderChangeTime > 2000 + Math.random() * 2000) {
				this.wanderAngle = Math.random() * Math.PI * 2;
				this.wanderChangeTime = now;
			}

			this.x += Math.cos(this.wanderAngle) * this.speed * 0.5 * deltaTime;
			this.y += Math.sin(this.wanderAngle) * this.speed * 0.5 * deltaTime;
		}

		// Wraparound boundaries
		const worldWidth = maxScreenWidth;
		const worldHeight = maxScreenHeight;

		if (this.x < 0) {
			this.x = worldWidth - this.size;
		} else if (this.x > worldWidth - this.size) {
			this.x = 0;
		}

		if (this.y < 0) {
			this.y = worldHeight - this.size;
		} else if (this.y > worldHeight - this.size) {
			this.y = 0;
		}
	}

	takeDamage() {
		this.health--;
		if (this.health <= 0) {
			this.die();
			return true;
		}
		return false;
	}

	die() {
		this.alive = false;
		// Respawn after 3 seconds
		setTimeout(() => {
			this.respawn();
		}, 3000);
	}

	respawn() {
		this.x = this.spawnPoint.x;
		this.y = this.spawnPoint.y;
		this.health = 2;
		this.alive = true;
		this.targetPlayer = null;
		this.wanderAngle = Math.random() * Math.PI * 2;
		this.wanderChangeTime = Date.now();
	}

	getBotData() {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			alive: this.alive,
			color: this.color,
			size: this.size,
			isChasing: this.targetPlayer !== null,
		};
	}
}

// Initialize bots
function initializeBots() {
	gameState.bots = [];
	botSpawnPoints.forEach((spawnPoint) => {
		const bot = new Bot(spawnPoint);
		gameState.bots.push(bot);
	});
	console.log(`Initialized ${gameState.bots.length} bots`);
}

// Call initialization
initializeBots();

// Game loop
let lastUpdate = Date.now();
const gameLoop = () => {
	const now = Date.now();
	const deltaTime = (now - lastUpdate) / 1000;
	lastUpdate = now;

	// Update players
	for (const [playerId, player] of gameState.players) {
		player.updateEffects();
		player.move(deltaTime);
	}

	// Update bots
	for (const bot of gameState.bots) {
		bot.update(deltaTime);
	}

	// Update interactive objects
	for (const obj of gameState.interactiveObjects) {
		if (!obj.active && obj.respawnTime && now > obj.respawnTime) {
			obj.active = true;
			obj.respawnTime = 0;
		}
	}

	// Update bullets
	gameState.bullets = gameState.bullets.filter((bullet) => {
		bullet.x += bullet.vx * deltaTime;
		bullet.y += bullet.vy * deltaTime;

		// Wraparound for bullets
		const worldWidth = maxScreenWidth;
		const worldHeight = maxScreenHeight;

		if (bullet.x < 0) {
			bullet.x = worldWidth;
		} else if (bullet.x > worldWidth) {
			bullet.x = 0;
		}

		if (bullet.y < 0) {
			bullet.y = worldHeight;
		} else if (bullet.y > worldHeight) {
			bullet.y = 0;
		}

		// Remove bullets that are too old
		if (now - bullet.createdAt > 3000) {
			return false;
		}

		// Check obstacle collisions
		const bulletRect = {
			x: bullet.x - GAME_CONFIG.BULLET_SIZE / 2,
			y: bullet.y - GAME_CONFIG.BULLET_SIZE / 2,
			width: GAME_CONFIG.BULLET_SIZE,
			height: GAME_CONFIG.BULLET_SIZE,
		};

		for (const obstacle of gameState.obstacles) {
			if (checkCollision(bulletRect, obstacle)) {
				return false; // Remove bullet
			}
		}

		// Check bouncer collisions
		for (const obj of gameState.interactiveObjects) {
			if (obj.type === 'bouncer' && checkCollision(bulletRect, obj)) {
				// Bounce bullet
				const centerX = obj.x + obj.width / 2;
				const centerY = obj.y + obj.height / 2;
				const deltaX = bullet.x - centerX;
				const deltaY = bullet.y - centerY;

				// Reverse direction based on collision side
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					bullet.vx = -bullet.vx;
				} else {
					bullet.vy = -bullet.vy;
				}

				// Move bullet away from bouncer to prevent multiple collisions
				bullet.x += bullet.vx * deltaTime * 2;
				bullet.y += bullet.vy * deltaTime * 2;
			}
		}

		// Check player collisions
		for (const [playerId, player] of gameState.players) {
			if (player.id === bullet.playerId || !player.alive) continue;

			const playerRect = {
				x: player.x,
				y: player.y,
				width: GAME_CONFIG.PLAYER_SIZE,
				height: GAME_CONFIG.PLAYER_SIZE,
			};

			if (checkCollision(bulletRect, playerRect)) {
				const damaged = player.takeDamage();
				if (damaged) {
					const shooter = gameState.players.get(bullet.playerId);
					if (shooter) shooter.kills++;

					io.emit('playerHit', {
						playerId: player.id,
						shooterId: bullet.playerId,
					});
				}

				return false; // Remove bullet
			}
		}

		// Check bot hits
		for (const bot of gameState.bots) {
			if (!bot.alive) continue;

			const botRect = {
				x: bot.x,
				y: bot.y,
				width: bot.size,
				height: bot.size,
			};

			if (checkCollision(bulletRect, botRect)) {
				const killed = bot.takeDamage();
				const shooter = gameState.players.get(bullet.playerId);

				if (killed && shooter) {
					// Add bot kill to player stats
					if (!shooter.botKills) shooter.botKills = 0;
					shooter.botKills++;

					io.emit('botKilled', {
						botId: bot.id,
						killerId: bullet.playerId,
						x: bot.x,
						y: bot.y,
					});
				}

				return false; // Remove bullet
			}
		}

		return true;
	});

	// Broadcast game state with player data
	const playersData = Array.from(gameState.players.values()).map((player) =>
		player.getPlayerData()
	);

	const botsData = gameState.bots.map((bot) => bot.getBotData());

	io.emit('gameState', {
		players: playersData,
		bullets: gameState.bullets,
		bots: botsData,
		obstacles: gameState.obstacles,
		interactiveObjects: gameState.interactiveObjects,
	});
};

function checkCollision(rect1, rect2) {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
}

// Start game loop
setInterval(gameLoop, 1000 / 60); // 60 FPS

// Socket handling
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Receive screen dimensions from clients
	socket.on('screenDimensions', (dimensions) => {
		if (dimensions && dimensions.width && dimensions.height) {
			// Update to use the largest screen dimensions
			if (dimensions.width > maxScreenWidth) {
				maxScreenWidth = dimensions.width;
				console.log(`Updated world width to ${maxScreenWidth}`);
			}
			if (dimensions.height > maxScreenHeight) {
				maxScreenHeight = dimensions.height;
				console.log(`Updated world height to ${maxScreenHeight}`);
			}

			// Send world dimensions back to all clients
			io.emit('worldDimensions', {
				width: maxScreenWidth,
				height: maxScreenHeight,
			});
		}
	});

	socket.on('joinGame', (playerName) => {
		const player = new Player(
			socket.id,
			playerName || `Player ${socket.id.slice(0, 4)}`
		);
		gameState.players.set(socket.id, player);

		console.log(
			`Player ${player.name} joined the game at position (${player.x}, ${player.y})`
		);

		// Send confirmation to the joining player
		socket.emit('playerJoined', {
			playerId: socket.id,
			gameConfig: GAME_CONFIG,
			playerData: player.getPlayerData(),
		});

		// Notify all clients about the new player
		io.emit('playerConnected', player.getPlayerData());
	});

	socket.on('playerInput', (input) => {
		const player = gameState.players.get(socket.id);
		if (player && input !== null && input !== undefined) {
			player.updateInput(input);
		}
	});

	// Handle explicit aim direction setting
	socket.on('playerAim', (direction) => {
		const player = gameState.players.get(socket.id);
		if (player && direction !== null && direction !== undefined) {
			player.setAimDirection(direction);
		}
	});

	socket.on('playerShoot', () => {
		const player = gameState.players.get(socket.id);
		if (player) {
			const bullet = player.shoot();
			if (bullet) {
				gameState.bullets.push(bullet);
				console.log(
					`Player ${
						player.name
					} shot bullet in direction (${player.aimDirection.x.toFixed(
						2
					)}, ${player.aimDirection.y.toFixed(
						2
					)}) with velocity (${bullet.vx.toFixed(2)}, ${bullet.vy.toFixed(2)})`
				);
			}
		}
	});

	socket.on('disconnect', () => {
		const player = gameState.players.get(socket.id);
		if (player) {
			console.log(`Player ${player.name} left the game`);
			gameState.players.delete(socket.id);
			io.emit('playerDisconnected', socket.id);
		}
	});
});

server.listen(PORT, () => {
	console.log(`QR Party server running on port ${PORT}`);
});
