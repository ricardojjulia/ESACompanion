import React, { useState, useEffect } from 'react';

type LEDStatus = 'on' | 'off' | 'blink';

interface LEDIndicatorProps {
  label: string;
  status: LEDStatus;
}

export const LEDIndicator: React.FC<LEDIndicatorProps> = ({ label, status }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (status !== 'blink') {
      setIsBlinking(false);
      return;
    }

    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 600);

    return () => clearInterval(interval);
  }, [status]);

  const getColor = () => {
    switch (status) {
      case 'on':
        return '#00ff00';
      case 'off':
        return '#333333';
      case 'blink':
        return isBlinking ? '#ffff00' : '#666666';
    }
  };

  const getGlow = () => {
    if (status === 'off') return 'none';
    if (status === 'on') return `0 0 12px #00ff00`;
    if (status === 'blink' && isBlinking) return `0 0 12px #ffff00`;
    return 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {/* LED Light */}
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: getColor(),
          boxShadow: getGlow(),
          border: `2px solid ${getColor()}`,
          transition: 'all 0.1s ease-out',
          filter: `drop-shadow(0 0 3px ${getColor()})`,
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
};
