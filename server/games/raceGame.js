import { BaseGame } from './baseGame.js';

// Простая гоночная игра (пример второй игры)
class RacePlayer {
	constructor(id, name, trackWidth, trackHeight, color) {
		this.id = id;
		this.name = name;
		this.x = 100;
		this.y = trackHeight / 2;
		this.speed = 0;
		this.angle = 0; // Угол поворота автомобиля
		this.maxSpeed = 300;
		this.acceleration = 150;
		this.color = color;
		this.lap = 0;
		this.checkpoints = new Set();
		this.currentInput = { accelerate: 0, turn: 0 }; // accelerate: -1 to 1, turn: -1 to 1
		this.alive = true;
	}

	updateInput(input) {
		this.currentInput.accelerate = Math.max(
			-1,
			Math.min(1, parseFloat(input.accelerate) || 0)
		);
		this.currentInput.turn = Math.max(
			-1,
			Math.min(1, parseFloat(input.turn) || 0)
		);
	}

	move(deltaTime, trackWidth, trackHeight) {
		if (!this.alive) return;

		// Ускорение/торможение
		if (this.currentInput.accelerate > 0) {
			this.speed = Math.min(
				this.maxSpeed,
				this.speed + this.acceleration * deltaTime
			);
		} else if (this.currentInput.accelerate < 0) {
			this.speed = Math.max(
				-this.maxSpeed / 2,
				this.speed - this.acceleration * deltaTime
			);
		} else {
			// Естественное замедление
			if (this.speed > 0) {
				this.speed = Math.max(
					0,
					this.speed - this.acceleration * 0.5 * deltaTime
				);
			} else {
				this.speed = Math.min(
					0,
					this.speed + this.acceleration * 0.5 * deltaTime
				);
			}
		}

		// Поворот (зависит от скорости)
		const turnSpeed = 3; // радианы в секунду
		if (Math.abs(this.speed) > 10) {
			this.angle += this.currentInput.turn * turnSpeed * deltaTime;
		}

		// Движение
		this.x += Math.cos(this.angle) * this.speed * deltaTime;
		this.y += Math.sin(this.angle) * this.speed * deltaTime;

		// Ограничения по трассе
		const margin = 30;
		if (this.x < margin) this.x = margin;
		if (this.x > trackWidth - margin) this.x = trackWidth - margin;
		if (this.y < margin) this.y = margin;
		if (this.y > trackHeight - margin) this.y = trackHeight - margin;
	}

	getPlayerData() {
		return {
			id: this.id,
			name: this.name,
			x: this.x,
			y: this.y,
			angle: this.angle,
			speed: this.speed,
			color: this.color,
			lap: this.lap,
			alive: this.alive,
		};
	}
}

export class RaceGame extends BaseGame {
	constructor(gameId, config = {}) {
		super(gameId, config);
		this.gameType = 'race';

		this.trackWidth = config.trackWidth || 1920;
		this.trackHeight = config.trackHeight || 1080;

		this.checkpoints = [
			{ id: 'cp1', x: 400, y: 200, width: 50, height: 200 },
			{ id: 'cp2', x: 800, y: 500, width: 50, height: 200 },
			{ id: 'cp3', x: 1200, y: 300, width: 50, height: 200 },
		];

		this.obstacles = [
			{ x: 500, y: 400, width: 100, height: 100, type: 'barrier' },
			{ x: 900, y: 200, width: 100, height: 100, type: 'barrier' },
		];

		this.playerColors = [
			'#ff0000',
			'#00ff00',
			'#0000ff',
			'#ffff00',
			'#ff00ff',
			'#00ffff',
			'#ff8800',
			'#8800ff',
			'#00ff88',
			'#ff0088',
		];
		this.colorIndex = 0;
	}

	addPlayer(playerId, playerName) {
		const color = this.playerColors[this.colorIndex % this.playerColors.length];
		this.colorIndex++;

		const player = new RacePlayer(
			playerId,
			playerName,
			this.trackWidth,
			this.trackHeight,
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

	checkCollision(rect1, rect2) {
		return (
			rect1.x < rect2.x + rect2.width &&
			rect1.x + rect1.width > rect2.x &&
			rect1.y < rect2.y + rect2.height &&
			rect1.y + rect1.height > rect2.y
		);
	}

	update(deltaTime) {
		for (const [, player] of this.players) {
			player.move(deltaTime, this.trackWidth, this.trackHeight);

			// Проверяем чекпоинты
			const playerRect = {
				x: player.x - 15,
				y: player.y - 15,
				width: 30,
				height: 30,
			};
			for (const checkpoint of this.checkpoints) {
				if (this.checkCollision(playerRect, checkpoint)) {
					player.checkpoints.add(checkpoint.id);

					// Если прошли все чекпоинты, засчитываем круг
					if (player.checkpoints.size === this.checkpoints.length) {
						player.lap++;
						player.checkpoints.clear();
					}
				}
			}

			// Проверяем столкновения с препятствиями
			for (const obstacle of this.obstacles) {
				if (this.checkCollision(playerRect, obstacle)) {
					// Замедляем при столкновении
					player.speed *= 0.5;
				}
			}
		}
	}

	getGameState() {
		const playersData = Array.from(this.players.values()).map((player) =>
			player.getPlayerData()
		);

		return {
			players: playersData,
			checkpoints: this.checkpoints,
			obstacles: this.obstacles,
		};
	}

	updateWorldSize(width, height) {
		if (width > this.trackWidth) this.trackWidth = width;
		if (height > this.trackHeight) this.trackHeight = height;
		return { width: this.trackWidth, height: this.trackHeight };
	}
}
