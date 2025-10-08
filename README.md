# OSG - One Screen Games

Turn any screen into an instant multiplayer arena. Your phone becomes the controller.

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

## 🎮 How to Use

1. **Choose a game** on the main page
2. **Scan the QR code** with mobile devices
3. **Play together!**

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

## 🎯 Available Games

- **Battle Arena** 🎯 - Top-down shooter with bots and power-ups
- **Race Track** 🏎️ - Racing game with checkpoints

---

## 🛠 Development

### Project Structure

```
OSG/
├── server/                 # Node.js + Socket.io server
│   ├── server.js          # Main server file
│   ├── gameRoomManager.js # Room management
│   └── games/             # Game modules
│       ├── baseGame.js
│       ├── shooterGame.js
│       └── raceGame.js
└── client/                # Next.js client
    ├── app/
    │   ├── page.tsx       # Main page with game selection
    │   └── game/[gameType]/ # Dynamic game routes
    └── components/
        ├── GameScreen.tsx
        ├── MobileController.tsx
        └── ui/            # shadcn/ui components
```

### Adding a New Game

1. Create game class in `server/games/`
2. Register in `server/games/index.js`
3. Create UI components in `client/components/`
4. Add to routing in `client/app/game/[gameType]/page.tsx`

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

## 📦 Technologies

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, TailwindCSS
- **Graphics**: PixiJS v8
- **Components**: Carousel (Embla), Cards, Buttons, Badges

---

## 📄 License

MIT
