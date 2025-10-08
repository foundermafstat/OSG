import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import MobileController from './components/MobileController';
import QRCodeDisplay from './components/QRCodeDisplay';
import { Gamepad2, Monitor, Smartphone } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'controller'>('home');
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    // Check URL for controller mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const id = urlParams.get('id');
    
    if (mode === 'controller' && id) {
      setGameId(id);
      setCurrentView('controller');
    }
  }, []);

  const startGame = () => {
    const newGameId = Math.random().toString(36).substring(2, 8);
    setGameId(newGameId);
    setCurrentView('game');
  };

  if (currentView === 'controller') {
    return <MobileController gameId={gameId} />;
  }

  if (currentView === 'game') {
    return <GameScreen gameId={gameId} onBack={() => setCurrentView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">QR Party</h1>
          <p className="text-gray-300">Multiplayer gaming made simple</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="space-y-4">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Monitor className="w-5 h-5" />
              <span>Start Game Screen</span>
            </button>

            <div className="text-center text-gray-400 text-sm">
              Start the game screen, then scan the QR code with mobile devices to join
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Mobile controllers connect automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;