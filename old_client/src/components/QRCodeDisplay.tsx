import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [url]);

  return (
    <div className="text-center">
      <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-gray-300 text-sm mt-3">
        Scan with mobile device to join
      </p>
      <div className="mt-2 p-2 bg-gray-700/50 rounded-lg">
        <p className="text-gray-400 text-xs break-all">{url}</p>
      </div>
    </div>
  );
};

export default QRCodeDisplay;