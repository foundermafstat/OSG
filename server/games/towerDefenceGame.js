import { BaseGame } from './baseGame.js';

// Tower Defence Game
class Tower {
	constructor(id, x, y, type = 'basic') {
		this.id = id;
		this.x = x;
		this.y = y;
		this.type = type;
		this.level = 1;

		// Tower stats based on type and level
		this.updateStats();
	}

	updateStats() {
		const types = {
			basic: { damage: 10, range: 150, fireRate: 1.0, cost: 50 },
			rapid: { damage: 5, range: 120, fireRate: 0.3, cost: 75 },
			sniper: { damage: 50, range: 300, fireRate: 2.0, cost: 150 },
			splash: { damage: 15, range: 130, fireRate: 1.5, cost: 100 },
		};

		const baseStats = types[this.type] || types.basic;
		const levelMultiplier = this.level;

		this.damage = baseStats.damage * levelMultiplier;
		this.range = baseStats.range + (this.level - 1) * 15;
		this.fireRate = baseStats.fireRate / (1 + (this.level - 1) * 0.1);
		this.cost = baseStats.cost;
		this.upgradeCost = Math.floor(this.cost * 0.7 * this.level);
		this.lastShot = 0;
	}

	upgrade() {
		this.level++;
		this.updateStats();
	}

	canShoot(currentTime) {
		return currentTime - this.lastShot >= this.fireRate;
	}

	shoot(currentTime) {
		this.lastShot = currentTime;
	}
}

class Mob {
	constructor(id, wave, path) {
		this.id = id;
		this.wave = wave;
		this.path = path;
		this.pathIndex = 0;
		this.x = path[0].x;
		this.y = path[0].y;
		this.alive = true;

		// Stats increase with wave
		this.maxHealth = 50 + (wave - 1) * 20;
		this.health = this.maxHealth;
		this.speed = 50 + (wave - 1) * 2;
		this.reward = 10 + (wave - 1) * 5;
		this.damage = 1 + Math.floor(wave / 5);

		this.color = this.getColorByHealth();
	}

	getColorByHealth() {
		const healthPercent = this.health / this.maxHealth;
		if (healthPercent > 0.66) return '#4CAF50';
		if (healthPercent > 0.33) return '#FFC107';
		return '#F44336';
	}

	move(deltaTime) {
		if (!this.alive || this.pathIndex >= this.path.length - 1) return false;

		const target = this.path[this.pathIndex + 1];
		const dx = target.x - this.x;
		const dy = target.y - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 5) {
			// Reached waypoint
			this.pathIndex++;
			if (this.pathIndex >= this.path.length - 1) {
				// Reached castle
				return 'reached_castle';
			}
			return true;
		}

		// Move towards target
		const moveDistance = this.speed * deltaTime;
		this.x += (dx / distance) * moveDistance;
		this.y += (dy / distance) * moveDistance;

		return true;
	}

	takeDamage(damage) {
		this.health -= damage;
		this.color = this.getColorByHealth();
		if (this.health <= 0) {
			this.alive = false;
			return true; // Died
		}
		return false;
	}
}

class Projectile {
	constructor(id, tower, target) {
		this.id = id;
		this.x = tower.x;
		this.y = tower.y;
		this.targetId = target.id;
		this.damage = tower.damage;
		this.speed = 300;
		this.isSplash = tower.type === 'splash';
		this.splashRadius = 50;
	}
}

export class TowerDefenceGame extends BaseGame {
	constructor(gameId, config = {}) {
		super(gameId, config);
		this.gameType = 'towerdefence';

		// Game configuration
		this.worldWidth = config.worldWidth || 1440;
		this.worldHeight = config.worldHeight || 800;

		// Game state
		this.towers = new Map();
		this.mobs = new Map();
		this.projectiles = new Map();
		this.buildSpots = [];
		this.path = [];
		this.castle = { x: 0, y: 0, health: 100, maxHealth: 100 };

		// Game variables
		this.wave = 0;
		this.money = 200; // Starting money
		this.isWaveActive = false;
		this.waveTimer = 0;
		this.waveCooldown = 10; // Seconds between waves
		this.mobsToSpawn = [];
		this.spawnTimer = 0;
		this.nextMobId = 0;
		this.nextTowerId = 0;
		this.nextProjectileId = 0;
		this.gameOver = false;
		this.gameTime = 0;

		// Initialize game world
		this.initializeWorld();
	}

	initializeWorld() {
		// Create path for mobs (snake-like pattern)
		const startX = this.worldWidth - 50;
		const startY = 50;
		const endX = 50;
		const endY = this.worldHeight - 50;

		this.path = [
			{ x: startX, y: startY },
			{ x: startX - 300, y: startY },
			{ x: startX - 300, y: startY + 200 },
			{ x: startX - 600, y: startY + 200 },
			{ x: startX - 600, y: startY + 400 },
			{ x: startX - 900, y: startY + 400 },
			{ x: startX - 900, y: startY + 600 },
			{ x: endX, y: startY + 600 },
			{ x: endX, y: endY },
		];

		// Castle position (end of path)
		this.castle = {
			x: endX,
			y: endY,
			health: 100,
			maxHealth: 100,
		};

		// Create build spots along the path
		const buildPositions = [
			{ x: startX - 150, y: startY - 60 },
			{ x: startX - 150, y: startY + 60 },
			{ x: startX - 450, y: startY + 140 },
			{ x: startX - 450, y: startY + 260 },
			{ x: startX - 750, y: startY + 340 },
			{ x: startX - 750, y: startY + 460 },
			{ x: startX - 1050, y: startY + 340 },
			{ x: startX - 1050, y: startY + 460 },
			{ x: endX + 120, y: startY + 540 },
			{ x: endX + 120, y: endY - 60 },
		];

		buildPositions.forEach((pos, index) => {
			this.buildSpots.push({
				id: `spot-${index}`,
				x: pos.x,
				y: pos.y,
				occupied: false,
				towerId: null,
			});
		});

		console.log(
			`[TowerDefence] World initialized: ${this.worldWidth}x${this.worldHeight}, ${this.buildSpots.length} build spots`
		);
	}

	addPlayer(playerId, playerName) {
		const player = {
			id: playerId,
			name: playerName,
			role: 'commander', // All players are commanders
			isActive: true,
		};

		this.players.set(playerId, player);
		console.log(`[TowerDefence] Player ${playerName} joined as commander`);

		return player;
	}

	removePlayer(playerId) {
		this.players.delete(playerId);
		console.log(`[TowerDefence] Player ${playerId} left`);
	}

	handlePlayerInput(playerId, input) {
		const player = this.players.get(playerId);
		if (!player) return;

		// Handle tower commands
		if (input.action === 'buildTower') {
			this.buildTower(input.spotId, input.towerType);
		} else if (input.action === 'upgradeTower') {
			this.upgradeTower(input.towerId);
		} else if (input.action === 'sellTower') {
			this.sellTower(input.towerId);
		} else if (input.action === 'startWave') {
			this.startNextWave();
		}
	}

	buildTower(spotId, towerType = 'basic') {
		const spot = this.buildSpots.find((s) => s.id === spotId);
		if (!spot || spot.occupied) return false;

		const tower = new Tower(
			`tower-${this.nextTowerId++}`,
			spot.x,
			spot.y,
			towerType
		);

		if (this.money < tower.cost) {
			console.log(
				`[TowerDefence] Not enough money to build ${towerType} tower`
			);
			return false;
		}

		this.money -= tower.cost;
		this.towers.set(tower.id, tower);
		spot.occupied = true;
		spot.towerId = tower.id;

		console.log(
			`[TowerDefence] Built ${towerType} tower at ${spot.id} for ${tower.cost} gold`
		);
		return true;
	}

	upgradeTower(towerId) {
		const tower = this.towers.get(towerId);
		if (!tower) return false;

		if (this.money < tower.upgradeCost) {
			console.log(`[TowerDefence] Not enough money to upgrade tower`);
			return false;
		}

		this.money -= tower.upgradeCost;
		tower.upgrade();

		console.log(
			`[TowerDefence] Upgraded tower ${towerId} to level ${tower.level}`
		);
		return true;
	}

	sellTower(towerId) {
		const tower = this.towers.get(towerId);
		if (!tower) return false;

		const refund = Math.floor(
			tower.cost * 0.5 + (tower.level - 1) * tower.cost * 0.3
		);
		this.money += refund;

		// Free up build spot
		const spot = this.buildSpots.find((s) => s.towerId === towerId);
		if (spot) {
			spot.occupied = false;
			spot.towerId = null;
		}

		this.towers.delete(towerId);
		console.log(`[TowerDefence] Sold tower ${towerId} for ${refund} gold`);
		return true;
	}

	startNextWave() {
		if (this.isWaveActive || this.gameOver) return;

		this.wave++;
		this.isWaveActive = true;

		// Calculate mobs for this wave
		const mobCount = 5 + this.wave * 2;
		this.mobsToSpawn = [];

		for (let i = 0; i < mobCount; i++) {
			this.mobsToSpawn.push({
				spawnTime: i * 1.0, // 1 second between each mob
			});
		}

		this.spawnTimer = 0;
		console.log(
			`[TowerDefence] Wave ${this.wave} started with ${mobCount} mobs`
		);
	}

	spawnMob() {
		const mob = new Mob(`mob-${this.nextMobId++}`, this.wave, this.path);
		this.mobs.set(mob.id, mob);
	}

	update(deltaTime) {
		if (this.gameOver) return;

		this.gameTime += deltaTime;

		// Wave management
		if (!this.isWaveActive) {
			this.waveTimer += deltaTime;
			// Auto-start first wave after 3 seconds
			if (this.wave === 0 && this.waveTimer > 3) {
				this.startNextWave();
			}
		} else {
			// Spawn mobs
			if (this.mobsToSpawn.length > 0) {
				this.spawnTimer += deltaTime;
				while (
					this.mobsToSpawn.length > 0 &&
					this.spawnTimer >= this.mobsToSpawn[0].spawnTime
				) {
					this.mobsToSpawn.shift();
					this.spawnMob();
				}
			}

			// Check if wave is complete
			if (this.mobsToSpawn.length === 0 && this.mobs.size === 0) {
				this.isWaveActive = false;
				this.waveTimer = 0;
				// Wave clear bonus
				const bonus = this.wave * 25;
				this.money += bonus;
				console.log(
					`[TowerDefence] Wave ${this.wave} complete! Bonus: ${bonus} gold`
				);
			}
		}

		// Update mobs
		for (const [id, mob] of this.mobs) {
			const result = mob.move(deltaTime);
			if (result === 'reached_castle') {
				// Mob reached castle
				this.castle.health -= mob.damage;
				this.mobs.delete(id);

				if (this.castle.health <= 0) {
					this.gameOver = true;
					console.log(
						`[TowerDefence] Game Over! Castle destroyed at wave ${this.wave}`
					);
				}
			} else if (!result) {
				// Mob should be removed
				this.mobs.delete(id);
			}
		}

		// Tower shooting
		for (const tower of this.towers.values()) {
			if (!tower.canShoot(this.gameTime)) continue;

			// Find closest mob in range
			let closestMob = null;
			let closestDistance = Infinity;

			for (const mob of this.mobs.values()) {
				if (!mob.alive) continue;

				const dx = mob.x - tower.x;
				const dy = mob.y - tower.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance <= tower.range && distance < closestDistance) {
					closestMob = mob;
					closestDistance = distance;
				}
			}

			if (closestMob) {
				tower.shoot(this.gameTime);

				// Create projectile
				const projectile = new Projectile(
					`proj-${this.nextProjectileId++}`,
					tower,
					closestMob
				);
				this.projectiles.set(projectile.id, projectile);
			}
		}

		// Update projectiles
		for (const [id, proj] of this.projectiles) {
			const target = this.mobs.get(proj.targetId);

			if (!target || !target.alive) {
				// Target is dead or missing, remove projectile
				this.projectiles.delete(id);
				continue;
			}

			// Move projectile towards target
			const dx = target.x - proj.x;
			const dy = target.y - proj.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 10) {
				// Hit!
				if (proj.isSplash) {
					// Splash damage
					for (const mob of this.mobs.values()) {
						const mobDx = mob.x - target.x;
						const mobDy = mob.y - target.y;
						const mobDist = Math.sqrt(mobDx * mobDx + mobDy * mobDy);

						if (mobDist <= proj.splashRadius) {
							const died = mob.takeDamage(
								proj.damage * (1 - mobDist / proj.splashRadius)
							);
							if (died) {
								this.money += mob.reward;
							}
						}
					}
				} else {
					// Single target damage
					const died = target.takeDamage(proj.damage);
					if (died) {
						this.money += target.reward;
					}
				}

				this.projectiles.delete(id);
			} else {
				// Move towards target
				const moveDistance = proj.speed * deltaTime;
				proj.x += (dx / distance) * moveDistance;
				proj.y += (dy / distance) * moveDistance;
			}
		}

		// Remove dead mobs
		for (const [id, mob] of this.mobs) {
			if (!mob.alive) {
				this.mobs.delete(id);
			}
		}
	}

	getGameState() {
		return {
			gameType: this.gameType,
			towers: Array.from(this.towers.values()).map((t) => ({
				id: t.id,
				x: t.x,
				y: t.y,
				type: t.type,
				level: t.level,
				range: t.range,
				damage: t.damage,
			})),
			mobs: Array.from(this.mobs.values()).map((m) => ({
				id: m.id,
				x: m.x,
				y: m.y,
				health: m.health,
				maxHealth: m.maxHealth,
				color: m.color,
				alive: m.alive,
			})),
			projectiles: Array.from(this.projectiles.values()).map((p) => ({
				id: p.id,
				x: p.x,
				y: p.y,
			})),
			path: this.path,
			buildSpots: this.buildSpots,
			castle: this.castle,
			wave: this.wave,
			money: this.money,
			isWaveActive: this.isWaveActive,
			nextWaveIn: this.isWaveActive
				? 0
				: Math.max(0, this.waveCooldown - this.waveTimer),
			gameOver: this.gameOver,
			players: Array.from(this.players.values()),
		};
	}

	updateWorldSize(width, height) {
		// Tower defence has fixed world size
		return { width: this.worldWidth, height: this.worldHeight };
	}
}
