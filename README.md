# 🎮 OSG - One Screen Games

**Transform any screen into an instant multiplayer arena. Your phone becomes the controller. No downloads. No installations. Just scan and play.**

> A revolutionary real-time multiplayer gaming platform where one screen hosts the action and mobile devices become instant gamepads through QR code magic.

---

## ✨ Why OSG?

### 🚀 **Instant Party Mode**

- **3 seconds to play**: Scan QR → Enter name → Game on
- No app downloads, no account creation, no friction
- Turn any gathering into a gaming session

### 📱 **Your Phone is the Controller**

- Full 360° movement joystick with precision control
- Multi-touch support: move and shoot simultaneously
- Haptic feedback and responsive UI
- Real-time stats and health tracking on your device

### 🎯 **Dynamic Gameplay**

- **Seamless wraparound world**: Exit one edge, appear on the opposite side
- **Smart AI bots**: Wander peacefully until they detect you, then chase relentlessly
- **Power-ups**: Speed boosts, shields, teleporters, and bouncers
- **Adaptive arena**: Game world automatically scales to any screen size

### 🎨 **Stunning Visuals**

- Smooth 60 FPS gameplay powered by PixiJS v8
- Blood splatter physics with particle effects
- Pulsating bot animations when hunting players
- Real-time visual feedback for all game events

---

## 🎯 Game Features

### Combat System

- **Precision shooting** in 360° with aim indicators
- **Smart bullets** with wraparound mechanics
- **Hit detection** with explosive particle effects
- **Health system**: 100 HP with gradual damage from bots (25 HP/sec)

### AI Enemies

- **Detection radius**: Bots sense players within 300px
- **Chase behavior**: Aggressive pursuit when players are spotted
- **2-hit kills**: Strategic combat against resilient enemies
- **Auto-respawn**: Enemies return after 3 seconds with blood splatter animation

### Power-ups & Obstacles

- 🟣 **Teleporters**: Instant transportation across the map
- 🔶 **Speed Boost**: 1.5x movement speed for 5 seconds
- 🔷 **Shield**: 8 seconds of invulnerability
- 🔴 **Bouncers**: Deflect bullets for tactical play
- 🧱 **Obstacles**: Strategic cover and maze elements

### Statistics & Progression

- **Player kills** tracked separately from bot kills
- **Death counter** with instant respawn
- **Bot elimination stats** displayed on mobile controller
- **Real-time leaderboard** visible on main screen

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- All devices on the same Wi-Fi network
- A large screen (computer/TV/projector)

### Installation

```bash
# 1. Install dependencies
cd client && npm install && cd ..

# 2. Configure your local IP address
# Edit client/env.config.ts with your network IP
```

**Find your IP address:**

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

Update `client/env.config.ts`:

```typescript
export const ENV_CONFIG = {
	LOCAL_IP: '192.168.1.XXX', // 👈 Your local IP here
	CLIENT_PORT: 3000,
	SERVER_PORT: 3001,
};
```

### Launch

```bash
# Start server and client together
npm run dev
```

**Open `http://localhost:3000`** in your browser

---

## 📱 How to Play

### For the Host (Computer/TV Screen)

1. **Launch the game**: Run `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Start game screen**: Click "Start Game Screen"
4. **Show QR code**: Click "Connect" button
5. **Let players scan**: QR code links to controller interface

### For Players (Mobile Devices)

1. **Scan QR code** with phone camera
2. **Enter player name**
3. **Start playing instantly**:
   - Left side: Movement joystick (360° control)
   - Right side: Shoot button (fires in movement direction)
4. **Watch your stats**: HP, kills, bot kills, and deaths in header

### Gameplay Tips

- 🎯 **Kill bots**: 2 shots eliminate an enemy bot
- 🏃 **Dodge**: Bots deal 25 HP/sec when touching you
- 🌀 **Use the edges**: Wraparound lets you escape or surprise enemies
- 💊 **Collect power-ups**: Speed and shields give tactical advantages
- 🎪 **Teleport strategically**: Use teleporters to escape danger

---

## 🏗️ Technical Architecture

### Tech Stack

**Frontend** (Next.js 15)

- ⚡ **Next.js 15**: React framework with App Router
- 🎨 **Tailwind CSS 4**: Modern utility-first styling
- 🎮 **PixiJS v8**: High-performance WebGL rendering
- 🔌 **Socket.IO Client**: Real-time bidirectional communication
- 📱 **Responsive Design**: Adaptive for both desktop and mobile

**Backend** (Node.js)

- 🚀 **Express**: Lightweight HTTP server
- 🌐 **Socket.IO**: WebSocket server with fallback
- 🤖 **Game Engine**: Custom physics and AI system
- ⚙️ **60 FPS game loop**: Smooth gameplay at 60 ticks per second

### Key Technologies

```
├── Real-time Multiplayer: Socket.IO with <20ms latency
├── Graphics Engine: PixiJS v8 with async initialization
├── Mobile Controls: Multi-touch gesture system
├── AI System: Dynamic pathfinding and chase behavior
├── Physics: Custom collision detection and wraparound mechanics
└── State Management: React hooks with refs for performance
```

---

## 🎯 Unique Features

### 1. **Zero Friction Multiplayer**

No downloads, no logins, no setup. Just scan and play. Perfect for:

- 🎉 Parties and gatherings
- 🏫 Classrooms and workshops
- 🏢 Team building events
- 🍕 Game nights with friends

### 2. **Truly One Screen**

Unlike split-screen games, everyone shares the same battlefield:

- 👀 **Full visibility**: See all players simultaneously
- 🎭 **Social gaming**: React to each other in real-time
- 📺 **Living room ready**: Perfect for any TV or projector
- 🌐 **Boundless world**: Seamless wraparound creates infinite playing field

### 3. **Dynamic Arena**

The game world adapts to your screen:

- **Auto-scaling**: Works on any resolution from 1080p to 4K
- **Boundless gameplay**: Wraparound edges create pac-man-style infinite space
- **Responsive design**: Optimized for both portrait and landscape displays

### 4. **Intelligent Enemy AI**

Bots aren't just targets—they're threats:

- 🧠 **Smart detection**: Scan 300px radius for threats
- 🏃 **Chase mechanics**: Actively pursue nearest player
- ⚔️ **Combat ready**: Deal continuous damage on contact
- 🔄 **Persistent threat**: Auto-respawn keeps pressure on

### 5. **Multi-Touch Excellence**

Mobile controller built for precision:

- ✌️ **True multi-touch**: Move and shoot independently
- 🎯 **Touch identifier tracking**: Each finger tracked separately
- 📍 **Pixel-perfect control**: 60px precision joystick
- 💪 **Haptic ready**: Native touch events with full support

---

## 🏛️ Project Structure

```
pixi.js-realtime-sockets-multiplayer-game/
│
├── 📱 client/                    # Next.js Application (Port 3000)
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # Home screen & routing
│   │   ├── layout.tsx          # App layout wrapper
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── GameScreen.tsx      # Main game display (PixiJS)
│   │   ├── MobileController.tsx # Mobile gamepad interface
│   │   └── QRCodeDisplay.tsx   # QR code generator
│   └── env.config.ts           # Network configuration
│
├── 🖥️ server/                    # Game Server (Port 3001)
│   └── server.js               # Socket.IO server + game logic
│
├── 📦 old_client/               # Legacy Vite client (deprecated)
│
└── 📄 Configuration Files
    ├── package.json            # Root dependencies
    └── README.md               # This file
```

---

## 🎮 Game Mechanics

### Player System

- **Health**: 100 HP per player
- **Movement**: 200 units/sec base speed (300 with boost)
- **Shooting**: 400 units/sec bullet speed, 300ms cooldown
- **Respawn**: 2 second delay after death
- **Collision**: 30x30 pixel hitbox

### Bot AI Behavior

```javascript
State Machine:
  IDLE → Wander randomly, change direction every 2-4 sec
    ↓ (Player within 300px)
  CHASE → Pursue nearest player at 150 units/sec
    ↓ (Within 35px of player)
  ATTACK → Deal 25 HP/sec continuous damage
    ↓ (Player escapes or dies)
  IDLE → Resume wandering
```

### World Physics

- **Seamless boundaries**: Wraparound on all edges
- **Collision detection**: AABB (Axis-Aligned Bounding Box)
- **Dynamic world size**: Adapts to largest connected screen
- **Bullet persistence**: 3 second lifetime with wraparound

---

## 🔧 Configuration

### Network Setup

Edit `client/env.config.ts`:

```typescript
export const ENV_CONFIG = {
	LOCAL_IP: '192.168.1.43', // Your machine's local IP
	CLIENT_PORT: 3000, // Next.js port
	SERVER_PORT: 3001, // Socket.IO port
};
```

**Important**: Ensure your firewall allows:

- Port **3000** (Next.js client)
- Port **3001** (Socket.IO server)

### Game Config

Edit `server/server.js`:

```javascript
const GAME_CONFIG = {
	WORLD_WIDTH: 1920, // Default world width
	WORLD_HEIGHT: 1080, // Default world height
	PLAYER_SIZE: 30, // Player hitbox
	PLAYER_SPEED: 200, // Base movement speed
	BULLET_SPEED: 400, // Projectile velocity
	RESPAWN_DELAY: 2000, // Milliseconds before respawn
};
```

---

## 🎨 Development

### Run Development Server

```bash
# Full stack (recommended)
npm run dev

# Server only
npm run server

# Client only
cd client && npm run dev
```

### Build for Production

```bash
# Build Next.js client
npm run build

# Run production server
npm start
```

### Testing Locally

1. **Solo testing**: Open two browser tabs

   - Tab 1: Game screen (`http://localhost:3000`)
   - Tab 2: Controller (`http://localhost:3000?mode=controller&id=test123`)

2. **Network testing**:
   - Desktop: Open game screen
   - Mobile: Scan QR or manually enter URL

---

## 🎯 API Reference

### Socket.IO Events

**Client → Server**

```typescript
'joinGame'           → (playerName: string)
'playerInput'        → ({ x: number, y: number })
'playerAim'          → ({ x: number, y: number })
'playerShoot'        → ()
'screenDimensions'   → ({ width: number, height: number })
```

**Server → Client**

```typescript
'gameState'          → { players, bullets, bots, obstacles, interactiveObjects }
'playerJoined'       → { playerId, gameConfig, playerData }
'playerConnected'    → (playerData)
'playerDisconnected' → (playerId)
'playerHit'          → { playerId, shooterId }
'botKilled'          → { botId, killerId, x, y }
'worldDimensions'    → { width, height }
```

### Game State Object

```typescript
{
  players: [{
    id: string,
    name: string,
    x: number, y: number,
    alive: boolean,
    health: number,
    color: string,
    kills: number,
    deaths: number,
    botKills: number,
    effects: {
      speedBoost: { active: boolean, endTime: number },
      shield: { active: boolean, endTime: number }
    },
    aimDirection: { x: number, y: number }
  }],
  bullets: [{ id, x, y, playerId, vx, vy }],
  bots: [{ id, x, y, alive, isChasing, color, size }],
  obstacles: [{ x, y, width, height, type }],
  interactiveObjects: [{ id, x, y, width, height, type, active }]
}
```

---

## 🌟 Advanced Features

### Seamless World Boundaries

Experience infinite gameplay with wraparound mechanics:

- Exit right edge → Appear on left edge
- Exit bottom → Appear on top
- Bullets maintain trajectory through boundaries
- Strategic gameplay: Escape or ambush through edges

### Adaptive Resolution

The game world dynamically adjusts:

- Server tracks largest connected screen
- All clients scale to match maximum dimensions
- Maintains consistent gameplay across all devices
- Supports resolutions from 1366x768 to 4K+

### Real-time Synchronization

- **60 FPS game loop** on server
- **<20ms latency** for input processing
- **Predictive rendering** on clients
- **State reconciliation** for smooth gameplay

---

## 🎨 Customization

### Add New Bot Spawn Points

Edit `server/server.js`:

```javascript
const botSpawnPoints = [
	{ x: 200, y: 200 },
	{ x: 1000, y: 400 },
	{ x: 600, y: 100 },
	{ x: 300, y: 500 }, // Add your spawn point
];
```

### Modify Bot Behavior

```javascript
class Bot {
	constructor(spawnPoint) {
		this.detectionRadius = 300; // Detection range
		this.speed = 150; // Chase speed
		this.damagePerSecond = 25; // Damage output
		this.health = 2; // Shots to kill
	}
}
```

### Add New Interactive Objects

```javascript
gameState.interactiveObjects.push({
	id: 'myObject1',
	x: 500,
	y: 300,
	width: 40,
	height: 40,
	type: 'customType',
	active: true,
});
```

---

## 📊 Performance

### Optimizations Implemented

- ✅ **React refs** for game objects (avoid re-renders)
- ✅ **Pixi.js Graphics reuse** (minimize object creation)
- ✅ **Touch event debouncing** (smooth input at 60 FPS)
- ✅ **State batching** (update once per frame)
- ✅ **Efficient collision detection** (spatial partitioning ready)

### Benchmarks

| Metric             | Performance               |
| ------------------ | ------------------------- |
| Server tick rate   | 60 FPS stable             |
| Client render      | 60 FPS+ on modern devices |
| Socket latency     | 15-25ms (local network)   |
| Max players tested | 8 simultaneous            |
| Max bots tested    | 10 simultaneous           |

---

## 🛠️ Troubleshooting

### Mobile Can't Connect

**Check network:**

```bash
# Verify devices are on same network
# Ping your computer from mobile (use network tools app)
```

**Firewall settings:**

- Allow incoming connections on port 3000 (Next.js)
- Allow incoming connections on port 3001 (Socket.IO)

**Common fixes:**

1. Restart router
2. Disable VPN on computer
3. Use `0.0.0.0` instead of localhost
4. Check if `LOCAL_IP` in `env.config.ts` matches your actual IP

### Game Lags or Stutters

**Client-side:**

- Close other browser tabs
- Disable browser extensions
- Use Chrome/Edge (better WebGL support)

**Server-side:**

- Check CPU usage (`top` or Task Manager)
- Reduce number of bots
- Increase game loop interval from 60 to 30 FPS

### QR Code Not Generating

```bash
# Install QR code dependency
cd client && npm install qrcode @types/qrcode
```

### Port Already in Use

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🔬 Technical Deep Dive

### Multi-Touch Implementation

OSG uses **touch identifier tracking** for perfect multi-touch:

```typescript
// Each touch gets unique identifier
joystickTouchIdRef.current = touch.identifier;

// Only respond to our tracked touch
for (let touch of touches) {
	if (touch.identifier === joystickTouchIdRef.current) {
		// Process this touch
	}
}
```

This allows:

- Joystick drag with one finger
- Shoot button tap with another finger
- **Simultaneous operation** without interference

### PixiJS v8 Migration

Updated to latest PixiJS async API:

```typescript
// Old (v7)
const app = new PIXI.Application({ width, height });
app.view; // Direct access

// New (v8)
const app = new PIXI.Application();
await app.init({ width, height });
app.canvas; // Canvas property
```

Benefits:

- Async initialization for better error handling
- Improved memory management
- Better TypeScript support

### Wraparound Boundary System

```javascript
// Players/Bots
if (x < 0) x = worldWidth - size;
if (x > worldWidth - size) x = 0;
if (y < 0) y = worldHeight - size;
if (y > worldHeight - size) y = 0;

// Bullets
if (bullet.x < 0) bullet.x = worldWidth;
if (bullet.x > worldWidth) bullet.x = 0;
// Same for Y axis
```

Creates infinite playing field effect like classic Asteroids.

---

## 📦 Deployment

### Local Network Deployment

**Perfect for:**

- Home parties
- LAN events
- Offline gaming sessions

**Setup:**

```bash
npm run build
npm start
```

Share your local IP on the network: `http://192.168.1.XXX:3000`

### Cloud Deployment (Advanced)

**Platforms:** Vercel, Heroku, Railway, DigitalOcean

**Requirements:**

- WebSocket support
- Node.js 18+
- Environment variables for IP configuration

**Note:** Cloud deployment requires public IP and may have WebSocket limitations.

---

## 🎓 Learning Resources

This project demonstrates:

- ✅ Real-time multiplayer architecture
- ✅ WebSocket communication patterns
- ✅ Game state synchronization
- ✅ AI pathfinding basics
- ✅ Particle system implementation
- ✅ Touch gesture handling
- ✅ Canvas-based rendering with PixiJS

**Great for learning:**

- Socket.IO in production
- React + Canvas integration
- Game development fundamentals
- Mobile-first UX design

---

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- [ ] More game modes (team deathmatch, capture the flag)
- [ ] Sound effects and music
- [ ] Multiple arenas/levels
- [ ] Power-up variety
- [ ] Customizable bot difficulty
- [ ] Replay system
- [ ] Tournament mode

---

## 📝 License

MIT License - feel free to use this project for learning, parties, or as a base for your own games!

---

## 🎉 Credits

**OSG - One Screen Games**

Built with:

- ❤️ Passion for multiplayer gaming
- ⚡ Modern web technologies
- 🎮 Focus on instant fun
- 🌟 Community-first approach

---

## 🚀 What's Next?

Future roadmap:

- 🎵 Sound system with spatial audio
- 🏆 Persistent leaderboards
- 🎨 Customizable player skins
- 🗺️ Multiple map layouts
- 👥 Team-based game modes
- 📱 Gyroscope aiming support
- 🎬 Kill cam replays

---

**Ready to turn any screen into a gaming arena? Just `npm run dev` and let the party begin! 🎊**

_Built for the web. Optimized for fun. Designed for everyone._
