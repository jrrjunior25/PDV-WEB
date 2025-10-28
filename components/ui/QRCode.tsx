import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 160 }) => {
  if (!value) {
    return null;
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <img 
      src={qrUrl} 
      alt="QR Code" 
      width={size} 
      height={size} 
      className="rounded-md shadow-sm"
    />
  );
};

export default QRCode;
