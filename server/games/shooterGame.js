import { BaseGame } from './baseGame.js';

// Класс игрока для шутера
class Player {
	constructor(id, name, worldWidth, worldHeight, playerSize, color) {
		this.id = id;
		this.name = name;
		this.x = worldWidth / 2 - playerSize / 2 + (Math.random() - 0.5) * 100;
		this.y = worldHeight / 2 - playerSize / 2 + (Math.random() - 0.5) * 100;
		this.health = 100;
		this.alive = true;
		this.color = color;
		this.lastShot = 0;
		this.kills = 0;
		this.deaths = 0;
		this.botKills = 0;
		this.facingDirection = { x: 0, y: -1 };
		this.aimDirection = { x: 0, y: -1 };
		this.currentInput = { x: 0, y: 0 };
		this.isMoving = false;
		this.effects = {
			speedBoost: { active: false, endTime: 0 },
			shield: { active: false, endTime: 0 },
		};
	}

	updateInput(input) {
		const x = Math.max(-1, Math.min(1, parseFloat(input.x) || 0));
		const y = Math.max(-1, Math.min(1, parseFloat(input.y) || 0));
		this.currentInput = { x, y };
		const inputMagnitude = Math.sqrt(x * x + y * y);
		this.isMoving = inputMagnitude > 0.1;
		if (this.isMoving) {
			this.facingDirection = { x, y };
			this.aimDirection = { x, y };
		}
	}

	setAimDirection(direction) {
		const x = Math.max(-1, Math.min(1, parseFloat(direction.x) || 0));
		const y = Math.max(-1, Math.min(1, parseFloat(direction.y) || 0));
		const magnitude = Math.sqrt(x * x + y * y);
		if (magnitude > 0.1) {
			this.aimDirection = { x, y };
		}
	}

	move(deltaTime, worldWidth, worldHeight, playerSize, obstacles, speed) {
		if (!this.alive) return;

		const speedMultiplier = this.effects.speedBoost.active ? 1.5 : 1;
		const moveSpeed = speed * speedMultiplier * deltaTime;

		let newX = this.x + this.currentInput.x * moveSpeed;
		let newY = this.y + this.currentInput.y * moveSpeed;

		// Wraparound boundaries
		if (newX < 0) {
			newX = worldWidth - playerSize;
		} else if (newX > worldWidth - playerSize) {
			newX = 0;
		}

		if (newY < 0) {
			newY = worldHeight - playerSize;
		} else if (newY > worldHeight - playerSize) {
			newY = 0;
		}

		// Check collisions
		const playerRect = {
			x: newX,
			y: newY,
			width: playerSize,
			height: playerSize,
		};
		let canMove = true;
		for (const obstacle of obstacles) {
			if (this.checkCollision(playerRect, obstacle)) {
				canMove = false;
				break;
			}
		}

		if (canMove) {
			this.x = newX;
			this.y = newY;
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

	shoot(bulletSpeed, playerSize) {
		const now = Date.now();
		if (!this.alive || now - this.lastShot < 300) return null;

		this.lastShot = now;
		let shootDirection = { ...this.aimDirection };
		const magnitude = Math.sqrt(
			shootDirection.x * shootDirection.x + shootDirection.y * shootDirection.y
		);

		if (magnitude < 0.1) {
			shootDirection = { ...this.facingDirection };
			const facingMagnitude = Math.sqrt(
				shootDirection.x * shootDirection.x +
					shootDirection.y * shootDirection.y
			);
			if (facingMagnitude < 0.1) {
				shootDirection = { x: 0, y: -1 };
			}
		}

		const length = Math.sqrt(
			shootDirection.x * shootDirection.x + shootDirection.y * shootDirection.y
		);
		const normalizedX = length > 0 ? shootDirection.x / length : 0;
		const normalizedY = length > 0 ? shootDirection.y / length : -1;

		return {
			id: `bullet_${now}_${this.id}`,
			x: this.x + playerSize / 2,
			y: this.y + playerSize / 2,
			vx: normalizedX * bulletSpeed,
			vy: normalizedY * bulletSpeed,
			playerId: this.id,
			createdAt: now,
		};
	}

	takeDamage() {
		if (!this.alive) return false;
		if (
			this.effects.shield.active &&
			Date.now() < this.effects.shield.endTime
		) {
			return false;
		}
		this.alive = false;
		this.deaths++;
		this.effects.speedBoost.active = false;
		this.effects.shield.active = false;
		return true;
	}

	respawn(worldWidth, worldHeight, playerSize) {
		this.alive = true;
		this.health = 100;
		this.x = worldWidth / 2 - playerSize / 2 + (Math.random() - 0.5) * 100;
		this.y = worldHeight / 2 - playerSize / 2 + (Math.random() - 0.5) * 100;
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

// Класс бота
class Bot {
	constructor(id, spawnPoint, size = 25) {
		this.id = id;
		this.x = spawnPoint.x;
		this.y = spawnPoint.y;
		this.spawnPoint = spawnPoint;
		this.health = 2;
		this.alive = true;
		this.color = '#ff4444';
		this.size = size;
		this.detectionRadius = 300;
		this.speed = 150;
		this.damagePerSecond = 25;
		this.lastDamageTime = 0;
		this.damageRadius = 35;
		this.targetPlayer = null;
		this.wanderAngle = Math.random() * Math.PI * 2;
		this.wanderChangeTime = Date.now();
	}

	update(deltaTime, players, worldWidth, worldHeight) {
		if (!this.alive) return;

		const now = Date.now();
		let nearestPlayer = null;
		let nearestDist = Infinity;

		for (const [, player] of players) {
			if (!player.alive) continue;
			const dx = player.x - this.x;
			const dy = player.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearestPlayer = player;
			}
		}

		if (nearestPlayer && nearestDist < this.detectionRadius) {
			this.targetPlayer = nearestPlayer;
			const dx = nearestPlayer.x - this.x;
			const dy = nearestPlayer.y - this.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist > 0) {
				this.x += (dx / dist) * this.speed * deltaTime;
				this.y += (dy / dist) * this.speed * deltaTime;
			}

			if (dist < this.damageRadius && now - this.lastDamageTime > 1000) {
				nearestPlayer.health -= this.damagePerSecond;
				this.lastDamageTime = now;
				if (nearestPlayer.health <= 0) {
					nearestPlayer.takeDamage();
				}
			}
		} else {
			this.targetPlayer = null;
			if (now - this.wanderChangeTime > 2000 + Math.random() * 2000) {
				this.wanderAngle = Math.random() * Math.PI * 2;
				this.wanderChangeTime = now;
			}
			this.x += Math.cos(this.wanderAngle) * this.speed * 0.5 * deltaTime;
			this.y += Math.sin(this.wanderAngle) * this.speed * 0.5 * deltaTime;
		}

		// Wraparound
		if (this.x < 0) this.x = worldWidth - this.size;
		else if (this.x > worldWidth - this.size) this.x = 0;
		if (this.y < 0) this.y = worldHeight - this.size;
		else if (this.y > worldHeight - this.size) this.y = 0;
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

// Игра-шутер
export class ShooterGame extends BaseGame {
	constructor(gameId, config = {}) {
		super(gameId, config);
		this.gameType = 'shooter';

		this.worldWidth = config.worldWidth || 1920;
		this.worldHeight = config.worldHeight || 1080;
		this.playerSize = config.playerSize || 30;
		this.playerSpeed = config.playerSpeed || 200;
		this.bulletSpeed = config.bulletSpeed || 400;
		this.bulletSize = config.bulletSize || 6;
		this.respawnDelay = config.respawnDelay || 2000;

		this.bullets = [];
		this.bots = [];
		this.botIdCounter = 0;

		this.obstacles = [{ x: 200, y: 150, width: 100, height: 20, type: 'wall' }];

		this.interactiveObjects = [
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
				id: 'shield1',
				x: 600,
				y: 100,
				width: 35,
				height: 35,
				type: 'shield',
				active: true,
				respawnTime: 0,
			},
			{
				id: 'bouncer1',
				x: 350,
				y: 350,
				width: 50,
				height: 50,
				type: 'bouncer',
			},
		];

		this.botSpawnPoints = [
			{ x: 200, y: 200 },
			{ x: 1000, y: 400 },
			{ x: 600, y: 100 },
		];

		this.playerColors = [
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
		];
		this.colorIndex = 0;

		// Инициализируем ботов
		this.initializeBots();
	}

	initializeBots() {
		this.bots = [];
		this.botSpawnPoints.forEach((spawnPoint) => {
			const bot = new Bot(`bot_${this.botIdCounter++}`, spawnPoint);
			this.bots.push(bot);
		});
	}

	addPlayer(playerId, playerName) {
		const color = this.playerColors[this.colorIndex % this.playerColors.length];
		this.colorIndex++;

		const player = new Player(
			playerId,
			playerName,
			this.worldWidth,
			this.worldHeight,
			this.playerSize,
			color
		);

		this.players.set(playerId, player);
		return player.getPlayerData();
	}

	handlePlayerInput(playerId, input) {
		const player = this.players.get(playerId);
		if (player && input !== null && input !== undefined) {
			player.updateInput(input);
		}
	}

	handlePlayerAim(playerId, direction) {
		const player = this.players.get(playerId);
		if (player && direction !== null && direction !== undefined) {
			player.setAimDirection(direction);
		}
	}

	handlePlayerShoot(playerId) {
		const player = this.players.get(playerId);
		if (player) {
			const bullet = player.shoot(this.bulletSpeed, this.playerSize);
			if (bullet) {
				this.bullets.push(bullet);
				return bullet;
			}
		}
		return null;
	}

	checkCollision(rect1, rect2) {
		return (
			rect1.x < rect2.x + rect2.width &&
			rect1.x + rect1.width > rect2.x &&
			rect1.y < rect2.y + rect2.height &&
			rect1.y + rect1.height > rect2.y
		);
	}

	update(deltaTime) {
		const now = Date.now();

		// Update players
		for (const [, player] of this.players) {
			player.updateEffects();
			player.move(
				deltaTime,
				this.worldWidth,
				this.worldHeight,
				this.playerSize,
				this.obstacles,
				this.playerSpeed
			);

			// Check interactive objects
			const playerRect = {
				x: player.x,
				y: player.y,
				width: this.playerSize,
				height: this.playerSize,
			};

			for (const obj of this.interactiveObjects) {
				if (player.checkCollision(playerRect, obj)) {
					this.handleObjectInteraction(player, obj, now);
				}
			}
		}

		// Update bots
		for (const bot of this.bots) {
			bot.update(deltaTime, this.players, this.worldWidth, this.worldHeight);
		}

		// Update interactive objects
		for (const obj of this.interactiveObjects) {
			if (!obj.active && obj.respawnTime && now > obj.respawnTime) {
				obj.active = true;
				obj.respawnTime = 0;
			}
		}

		// Update bullets
		this.bullets = this.bullets.filter((bullet) => {
			bullet.x += bullet.vx * deltaTime;
			bullet.y += bullet.vy * deltaTime;

			// Wraparound
			if (bullet.x < 0) bullet.x = this.worldWidth;
			else if (bullet.x > this.worldWidth) bullet.x = 0;
			if (bullet.y < 0) bullet.y = this.worldHeight;
			else if (bullet.y > this.worldHeight) bullet.y = 0;

			// Remove old bullets
			if (now - bullet.createdAt > 3000) return false;

			// Check obstacle collisions
			const bulletRect = {
				x: bullet.x - this.bulletSize / 2,
				y: bullet.y - this.bulletSize / 2,
				width: this.bulletSize,
				height: this.bulletSize,
			};

			for (const obstacle of this.obstacles) {
				if (this.checkCollision(bulletRect, obstacle)) {
					return false;
				}
			}

			// Check bouncer collisions
			for (const obj of this.interactiveObjects) {
				if (obj.type === 'bouncer' && this.checkCollision(bulletRect, obj)) {
					const centerX = obj.x + obj.width / 2;
					const centerY = obj.y + obj.height / 2;
					const deltaX = bullet.x - centerX;
					const deltaY = bullet.y - centerY;

					if (Math.abs(deltaX) > Math.abs(deltaY)) {
						bullet.vx = -bullet.vx;
					} else {
						bullet.vy = -bullet.vy;
					}

					bullet.x += bullet.vx * deltaTime * 2;
					bullet.y += bullet.vy * deltaTime * 2;
				}
			}

			// Check player hits
			for (const [, player] of this.players) {
				if (player.id === bullet.playerId || !player.alive) continue;

				const playerRect = {
					x: player.x,
					y: player.y,
					width: this.playerSize,
					height: this.playerSize,
				};

				if (this.checkCollision(bulletRect, playerRect)) {
					const damaged = player.takeDamage();
					if (damaged) {
						const shooter = this.players.get(bullet.playerId);
						if (shooter) shooter.kills++;

						// Schedule respawn
						setTimeout(() => {
							player.respawn(
								this.worldWidth,
								this.worldHeight,
								this.playerSize
							);
						}, this.respawnDelay);
					}
					return false;
				}
			}

			// Check bot hits
			for (const bot of this.bots) {
				if (!bot.alive) continue;

				const botRect = {
					x: bot.x,
					y: bot.y,
					width: bot.size,
					height: bot.size,
				};

				if (this.checkCollision(bulletRect, botRect)) {
					const killed = bot.takeDamage();
					const shooter = this.players.get(bullet.playerId);

					if (killed && shooter) {
						shooter.botKills++;
						setTimeout(() => bot.respawn(), 3000);
					}
					return false;
				}
			}

			return true;
		});
	}

	handleObjectInteraction(player, obj, now) {
		switch (obj.type) {
			case 'teleporter':
				if (now > obj.cooldown) {
					const target = this.interactiveObjects.find(
						(o) => o.id === obj.targetId
					);
					if (target) {
						player.x = target.x;
						player.y = target.y;
						obj.cooldown = now + 1000;
						target.cooldown = now + 1000;
					}
				}
				break;

			case 'speedBoost':
				if (obj.active) {
					player.effects.speedBoost = { active: true, endTime: now + 5000 };
					obj.active = false;
					obj.respawnTime = now + 10000;
				}
				break;

			case 'shield':
				if (obj.active) {
					player.effects.shield = { active: true, endTime: now + 8000 };
					obj.active = false;
					obj.respawnTime = now + 15000;
				}
				break;
		}
	}

	getGameState() {
		const playersData = Array.from(this.players.values()).map((player) =>
			player.getPlayerData()
		);

		const botsData = this.bots.map((bot) => bot.getBotData());

		return {
			players: playersData,
			bullets: this.bullets,
			bots: botsData,
			obstacles: this.obstacles,
			interactiveObjects: this.interactiveObjects,
		};
	}

	updateWorldSize(width, height) {
		if (width > this.worldWidth) this.worldWidth = width;
		if (height > this.worldHeight) this.worldHeight = height;
		return { width: this.worldWidth, height: this.worldHeight };
	}
}
