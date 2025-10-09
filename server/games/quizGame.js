import { BaseGame } from './baseGame.js';

// Player class for quiz game
class QuizPlayer {
	constructor(id, name, color, avatar) {
		this.id = id;
		this.name = name;
		this.color = color;
		this.avatar = avatar;
		this.score = 0;
		this.ready = false;
		this.currentAnswer = null;
		this.answerTime = null;
		this.correctAnswers = 0;
		this.wrongAnswers = 0;
	}

	setReady(ready) {
		this.ready = ready;
	}

	submitAnswer(answerIndex, timestamp) {
		this.currentAnswer = answerIndex;
		this.answerTime = timestamp;
	}

	resetAnswer() {
		this.currentAnswer = null;
		this.answerTime = null;
	}

	addScore(points) {
		this.score += points;
	}

	getPlayerData() {
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			avatar: this.avatar,
			score: this.score,
			ready: this.ready,
			correctAnswers: this.correctAnswers,
			wrongAnswers: this.wrongAnswers,
		};
	}
}

export class QuizGame extends BaseGame {
	constructor(gameId, config = {}) {
		super(gameId, config);
		this.gameType = 'quiz';

		// Game configuration
		this.minPlayers = config.minPlayers || 2;
		this.maxPlayers = config.maxPlayers || 8;
		this.totalRounds = config.totalRounds || 5;
		this.baseTimePerRound = config.baseTimePerRound || 20; // seconds
		this.timeDecreasePerRound = config.timeDecreasePerRound || 2; // seconds
		this.minTimePerRound = config.minTimePerRound || 10; // seconds
		this.basePoints = config.basePoints || 100;
		this.timeBonus = config.timeBonus || 50; // extra points for fast answers

		// Game state
		this.gameStarted = false;
		this.gameFinished = false;
		this.currentRound = 0;
		this.roundStartTime = null;
		this.roundDuration = this.baseTimePerRound;
		this.currentQuestion = null;
		this.showingResults = false;
		this.resultsStartTime = null;
		this.resultsDuration = 5000; // 5 seconds to show results

		// Player management
		this.playerColors = [
			'#FF6B6B', // red
			'#4ECDC4', // teal
			'#45B7D1', // blue
			'#FFA07A', // orange
			'#98D8C8', // mint
			'#F7DC6F', // yellow
			'#BB8FCE', // purple
			'#85C1E2', // light blue
		];

		this.playerAvatars = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤'];
		this.colorIndex = 0;

		// Questions database
		this.questions = this.generateQuestions();
		this.usedQuestions = [];
	}

	generateQuestions() {
		// Sample questions - in production this should be loaded from a database or API
		return [
			{
				question: 'What is the capital of France?',
				answers: ['London', 'Berlin', 'Paris', 'Madrid'],
				correctAnswer: 2,
			},
			{
				question: 'What is 2 + 2?',
				answers: ['3', '4', '5', '22'],
				correctAnswer: 1,
			},
			{
				question: 'Which planet is known as the Red Planet?',
				answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
				correctAnswer: 1,
			},
			{
				question: 'Who painted the Mona Lisa?',
				answers: [
					'Vincent van Gogh',
					'Pablo Picasso',
					'Leonardo da Vinci',
					'Michelangelo',
				],
				correctAnswer: 2,
			},
			{
				question: 'What is the largest ocean on Earth?',
				answers: [
					'Atlantic Ocean',
					'Indian Ocean',
					'Arctic Ocean',
					'Pacific Ocean',
				],
				correctAnswer: 3,
			},
			{
				question: 'In which year did World War II end?',
				answers: ['1943', '1944', '1945', '1946'],
				correctAnswer: 2,
			},
			{
				question: 'What is the chemical symbol for gold?',
				answers: ['Go', 'Gd', 'Au', 'Ag'],
				correctAnswer: 2,
			},
			{
				question: 'How many continents are there?',
				answers: ['5', '6', '7', '8'],
				correctAnswer: 2,
			},
			{
				question: 'What is the fastest land animal?',
				answers: ['Lion', 'Cheetah', 'Leopard', 'Tiger'],
				correctAnswer: 1,
			},
			{
				question: 'What is the tallest mountain in the world?',
				answers: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'],
				correctAnswer: 2,
			},
		];
	}

	addPlayer(playerId, playerName) {
		if (this.gameStarted) {
			throw new Error('Game already started');
		}

		if (this.players.size >= this.maxPlayers) {
			throw new Error('Game is full');
		}

		const color = this.playerColors[this.colorIndex % this.playerColors.length];
		const avatar =
			this.playerAvatars[this.colorIndex % this.playerAvatars.length];
		this.colorIndex++;

		const player = new QuizPlayer(playerId, playerName, color, avatar);
		this.players.set(playerId, player);

		return player.getPlayerData();
	}

	handlePlayerInput(playerId, input) {
		const player = this.players.get(playerId);
		if (!player) return;

		if (input.type === 'ready') {
			player.setReady(input.ready);

			// Check if we can start the game
			if (this.canStartGame() && !this.gameStarted) {
				this.startGame();
			}
		} else if (
			input.type === 'answer' &&
			this.gameStarted &&
			!this.showingResults
		) {
			// Only accept answers during active round
			if (this.currentQuestion && !player.currentAnswer) {
				player.submitAnswer(input.answerIndex, Date.now());
			}
		}
	}

	canStartGame() {
		const readyPlayers = Array.from(this.players.values()).filter(
			(p) => p.ready
		);
		return readyPlayers.length >= this.minPlayers;
	}

	startGame() {
		this.gameStarted = true;
		this.currentRound = 0;
		this.gameFinished = false;
		this.startNextRound();
	}

	startNextRound() {
		this.currentRound++;
		this.showingResults = false;
		this.resultsStartTime = null;

		// Calculate round duration (decreases each round)
		this.roundDuration = Math.max(
			this.minTimePerRound,
			this.baseTimePerRound -
				(this.currentRound - 1) * this.timeDecreasePerRound
		);

		// Reset player answers
		for (const [, player] of this.players) {
			player.resetAnswer();
		}

		// Select a new question
		this.currentQuestion = this.getRandomQuestion();
		this.roundStartTime = Date.now();
	}

	getRandomQuestion() {
		// Get questions that haven't been used yet
		const availableQuestions = this.questions.filter(
			(q) => !this.usedQuestions.includes(q)
		);

		// If all questions used, reset
		if (availableQuestions.length === 0) {
			this.usedQuestions = [];
			return this.questions[Math.floor(Math.random() * this.questions.length)];
		}

		const question =
			availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
		this.usedQuestions.push(question);
		return question;
	}

	calculatePoints(player) {
		if (player.currentAnswer !== this.currentQuestion.correctAnswer) {
			return 0;
		}

		// Base points for correct answer
		let points = this.basePoints;

		// Time bonus: faster answers get more points
		const timeElapsed = (player.answerTime - this.roundStartTime) / 1000; // seconds
		const timeRatio = 1 - timeElapsed / this.roundDuration;
		const bonus = Math.floor(this.timeBonus * Math.max(0, timeRatio));

		return points + bonus;
	}

	showRoundResults() {
		this.showingResults = true;
		this.resultsStartTime = Date.now();

		// Calculate and award points
		for (const [, player] of this.players) {
			const points = this.calculatePoints(player);
			if (points > 0) {
				player.addScore(points);
				player.correctAnswers++;
			} else if (player.currentAnswer !== null) {
				player.wrongAnswers++;
			}
		}
	}

	endGame() {
		this.gameFinished = true;
		this.showingResults = true;

		// Find winner(s)
		const maxScore = Math.max(
			...Array.from(this.players.values()).map((p) => p.score)
		);
		this.winners = Array.from(this.players.values())
			.filter((p) => p.score === maxScore)
			.map((p) => p.id);
	}

	update(deltaTime) {
		if (!this.gameStarted || this.gameFinished) return;

		const now = Date.now();

		if (this.showingResults) {
			// Show results for a fixed duration
			if (now - this.resultsStartTime >= this.resultsDuration) {
				if (this.currentRound >= this.totalRounds) {
					this.endGame();
				} else {
					this.startNextRound();
				}
			}
		} else if (this.currentQuestion) {
			// Check if round time expired
			const timeElapsed = (now - this.roundStartTime) / 1000;
			if (timeElapsed >= this.roundDuration) {
				this.showRoundResults();
			}
		}
	}

	getGameState() {
		const now = Date.now();
		const playersData = Array.from(this.players.values()).map((player) =>
			player.getPlayerData()
		);

		// Sort players by score for leaderboard
		const sortedPlayers = [...playersData].sort((a, b) => b.score - a.score);

		const state = {
			gameStarted: this.gameStarted,
			gameFinished: this.gameFinished,
			currentRound: this.currentRound,
			totalRounds: this.totalRounds,
			players: sortedPlayers,
			minPlayers: this.minPlayers,
			canStart: this.canStartGame(),
			showingResults: this.showingResults,
		};

		if (this.gameStarted && this.currentQuestion) {
			state.question = {
				text: this.currentQuestion.question,
				answers: this.currentQuestion.answers,
			};
			state.roundDuration = this.roundDuration;
			state.timeRemaining = Math.max(
				0,
				this.roundDuration - (now - this.roundStartTime) / 1000
			);
		}

		if (this.showingResults && this.currentQuestion) {
			state.correctAnswer = this.currentQuestion.correctAnswer;

			// Add player answers to state
			state.playerAnswers = {};
			for (const [playerId, player] of this.players) {
				state.playerAnswers[playerId] = {
					answer: player.currentAnswer,
					correct: player.currentAnswer === this.currentQuestion.correctAnswer,
				};
			}
		}

		if (this.gameFinished) {
			state.winners = this.winners;
		}

		return state;
	}
}
