"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FaQrcode } from 'react-icons/fa';

interface VirtualLocationProps {
  destination: string;
}

const VirtualLocation = ({ destination }: VirtualLocationProps) => {
  const [showQR, setShowQR] = useState(false);
  
  // Reset showQR when destination changes
  useEffect(() => {
    setShowQR(false);
  }, [destination]);
  
  if (!destination) return null;
  
  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Virtual Experience</h3>
        <button 
          onClick={() => setShowQR(!showQR)}
          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
        >
          <FaQrcode className="mr-1" />
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>
      </div>
      
      {showQR && (
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-3">
            <Image 
              src="/images/qr-code.jpg" 
              alt={`QR code for virtual tour of ${destination}`}
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className="text-center font-medium text-blue-600">
            View {destination} virtually
          </p>
          <p className="text-center text-sm text-gray-500 mt-1">
            Scan the QR code with your mobile device to experience a virtual tour
          </p>
        </div>
      )}
      
      {!showQR && (
        <p className="text-gray-700">
          Want to explore {destination} before you travel? Click "Show QR Code" to access a virtual tour of popular attractions and landmarks.
        </p>
      )}
    </div>
  );
};

export default VirtualLocation;
