# 🎮 OSG - One Screen Games

**Turn any screen into an instant multiplayer gaming arena. Your smartphone is your controller.**

No downloads. No installations. No hassle. Just scan, play, and compete with friends in seconds! 🚀

---

## ✨ What Makes OSG Special?

🎯 **Zero Setup** - No apps to install. Works directly in your browser.  
📱 **Phone = Controller** - Scan QR code and your phone becomes a gamepad instantly.  
🌐 **Local Network** - Ultra-low latency. Your data never leaves your network.  
👥 **Up to 10 Players** - Perfect for parties, team building, and family game nights.  
🎨 **Beautiful Graphics** - Powered by PixiJS v8 for smooth 60 FPS gameplay.  
🆓 **100% Free** - No subscriptions, no in-app purchases, no hidden fees.

## 🚀 Quick Start

### 1. Start the Server

```bash
cd server
node server.js
```

Server will start on port **3001**

### 2. Start the Client (in a new terminal)

```bash
cd client
npm run dev
```

Client will start on port **3000**

### 3. Open Browser

Go to `http://localhost:3000`

---

## 🎮 How to Play (It's Ridiculously Simple!)

1. **Open** the web app on any screen (TV, monitor, projector)
2. **Scan** the QR code with your smartphone camera
3. **Play!** Your phone is now a gamepad - start gaming instantly!

**That's it!** No app stores, no sign-ups, no waiting. From scan to play in under 3 seconds.

---

## ⚙️ Configuration

To play over local network, edit `client/env.config.ts`:

```typescript
export const ENV_CONFIG = {
	LOCAL_IP: '192.168.1.43', // ← Replace with your IP
	CLIENT_PORT: 3000,
	SERVER_PORT: 3001,
};
```

### Find Your IP:

**macOS/Linux:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**

```cmd
ipconfig
```

---

## 🎮 Available Games

### 1. Battle Arena 🎯

**Genre:** Top-down shooter  
**Players:** 2-10  
**Description:** Intense PvE action! Fight waves of AI bots, collect power-ups, and compete for the highest score. Fast-paced combat with dual-joystick mobile controls.

**Features:**

- 🤖 Smart AI enemies
- ⚡ Power-ups and health packs
- 🏆 Real-time leaderboard
- 🎮 Dual joystick controls (movement + aiming)

---

### 2. Race Track 🏎️

**Genre:** Racing  
**Players:** 2-10  
**Description:** High-speed competitive racing! Navigate through checkpoints, master the track, and leave your opponents in the dust.

**Features:**

- 🏁 Checkpoint-based racing system
- 💨 Boost mechanics
- 📊 Live race positions
- 🎮 Intuitive gas/brake/turn controls

---

### 3. Tower Defence 🏰

**Genre:** Strategy  
**Players:** 1-4 (Cooperative)  
**Description:** Protect your base from endless waves of enemies! Build, upgrade, and strategically place towers to survive as long as possible.

**Features:**

- 🗼 Multiple tower types with unique abilities
- ⬆️ Tower upgrade system
- 🌊 Progressive wave difficulty
- 💰 Resource management
- 🎮 Touch-optimized tower placement controls

---

## 🛠 Development

### Project Structure

```
OSG/
├── server/                    # Node.js + Socket.io server
│   ├── server.js             # Main server file
│   ├── gameRoomManager.js    # Room management
│   └── games/                # Game modules
│       ├── baseGame.js       # Base game class
│       ├── shooterGame.js    # Battle Arena logic
│       ├── raceGame.js       # Race Track logic
│       └── towerDefenceGame.js # Tower Defence logic
└── client/                   # Next.js client
    ├── app/
    │   ├── page.tsx          # Main page with game selection
    │   └── game/[gameType]/  # Dynamic game routes
    └── components/
        ├── GameScreen.tsx            # Battle Arena UI
        ├── MobileController.tsx      # Battle Arena mobile controls
        ├── RaceGameScreen.tsx        # Race Track UI
        ├── RaceMobileController.tsx  # Race mobile controls
        ├── TowerDefenceGameScreen.tsx     # Tower Defence UI
        ├── TowerDefenceMobileController.tsx # Tower Defence controls
        └── ui/                       # shadcn/ui components
```

### Adding a New Game

**Step-by-step guide:**

1. **Server-side Logic:**
   - Create game class in `server/games/yourGame.js`
   - Extend from `BaseGame` class
   - Implement `update()` and `handlePlayerInput()` methods
2. **Register Game:**

   - Add to `server/games/index.js`
   - Define game metadata (name, description, player limits, icon)

3. **Client-side UI:**

   - Create `YourGameScreen.tsx` in `client/components/`
   - Create `YourGameMobileController.tsx` for mobile controls
   - Use PixiJS for game rendering

4. **Routing:**
   - Add game type handler in `client/app/game/[gameType]/page.tsx`

**Current examples:** Check `shooterGame.js`, `raceGame.js`, or `towerDefenceGame.js` for reference implementations.

---

## 🐛 Troubleshooting

### Game cards not showing

1. Make sure server is running:

   ```bash
   curl http://localhost:3001/api/games
   ```

   Should return JSON with games

2. Check browser console (F12) for errors

3. Verify ports are free:
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

### Mobile devices not connecting

1. Ensure all devices are on the same Wi-Fi network
2. Check `LOCAL_IP` in `client/env.config.ts`
3. Make sure firewall isn't blocking ports 3000 and 3001

---

## 🛠️ Tech Stack

**Backend:**

- Node.js - Runtime environment
- Express - Web server framework
- Socket.io - Real-time bidirectional communication

**Frontend:**

- Next.js 15 - React framework with App Router
- React 19 - UI library
- TypeScript - Type safety
- TailwindCSS 4 - Utility-first styling

**Game Engine:**

- PixiJS v8 - High-performance 2D WebGL rendering
- 60 FPS game loop with delta time calculations

**UI Components:**

- shadcn/ui - Beautiful component library
- Embla Carousel - Smooth game selection
- Lucide Icons - Modern icon set

**Mobile Controls:**

- Touch events with pointer tracking
- Virtual joysticks
- Haptic feedback ready

---

## 🎯 Use Cases

**Perfect for:**

- 🎉 **House Parties** - Instant entertainment for guests
- 🏢 **Corporate Events** - Team building activities
- 👨‍👩‍👧‍👦 **Family Gatherings** - Fun for all ages
- 🎪 **Event Spaces** - Interactive gaming zones
- 🏫 **Schools** - Educational gaming sessions
- 🍕 **Game Cafés** - No controller maintenance needed

---

## 🚀 Roadmap

**Coming Soon:**

- [ ] More game types (puzzle, platformer, fighting)
- [ ] Custom game rooms with passwords
- [ ] Player profiles and statistics
- [ ] Replay system
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Custom skins and themes

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🎮 Adding new games
- 🐛 Bug fixes
- 📝 Documentation improvements
- 🎨 UI/UX enhancements

Feel free to open issues and pull requests!

---

## 📄 License

MIT - Use it, modify it, share it!

---

**Made with ❤️ for gamers who want to play instantly without the hassle.**

_Star ⭐ this repo if you love playing games with friends!_
