import React from 'react';

interface SignalBarsProps {
  label: string;
  level: 0 | 1 | 2 | 3 | 4;
}

export const SignalBars: React.FC<SignalBarsProps> = ({ label, level }) => {
  const bars = [
    { height: 12, delay: '0ms' },
    { height: 24, delay: '100ms' },
    { height: 36, delay: '200ms' },
    { height: 48, delay: '300ms' },
    { height: 60, delay: '400ms' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Label */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>

      {/* Signal bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          height: '70px',
          padding: '12px',
          backgroundColor: 'rgba(15, 20, 40, 0.8)',
          borderRadius: '8px',
          border: '1px solid rgba(100, 200, 255, 0.2)',
        }}
      >
        {bars.map((bar, index) => {
          const isActive = index <= level;
          const color = isActive ? '#00ffff' : 'rgba(100, 200, 255, 0.2)';
          const glow = isActive ? `0 0 8px #00ffff` : 'none';

          return (
            <div
              key={`bar-${index}`}
              style={{
                width: '6px',
                height: `${bar.height}px`,
                backgroundColor: color,
                borderRadius: '4px',
                boxShadow: glow,
                transition: 'all 0.2s ease-out',
                animation: isActive ? `pulse 1s ease-in-out infinite` : 'none',
                animationDelay: bar.delay,
                filter: `drop-shadow(0 0 3px ${color})`,
              }}
            />
          );
        })}
      </div>

      {/* Level display */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#00ffff',
          textAlign: 'center',
        }}
      >
        Level {level}/4 {level === 4 ? '● Excellent' : level >= 3 ? '● Good' : level >= 2 ? '● Fair' : '● Weak'}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};
