import React from 'react';

export const RotatingSpinner: React.FC = () => {
  const size = 80;
  const radius = 30;
  const centerX = size / 2;
  const centerY = size / 2;

  // Create 8 rotating dots
  const dots = [...Array(8)].map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, delay: i * 50 };
  });

  return (
    <svg
      width={size}
      height={size}
      style={{
        animation: 'spin 4s linear infinite',
      }}
    >
      {/* Outer ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="rgba(100, 200, 255, 0.1)"
        strokeWidth="2"
      />

      {/* Middle ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius * 0.7}
        fill="none"
        stroke="rgba(100, 200, 255, 0.05)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />

      {/* Rotating dots */}
      {dots.map((dot, i) => (
        <circle
          key={`dot-${i}`}
          cx={dot.x}
          cy={dot.y}
          r="3"
          fill="#64c8ff"
          style={{
            filter: 'drop-shadow(0 0 3px #64c8ff)',
            animation: `pulse-dot 1s ease-in-out infinite`,
            animationDelay: `${dot.delay}ms`,
          }}
        />
      ))}

      {/* Center circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r="4"
        fill="#64c8ff"
        style={{
          filter: 'drop-shadow(0 0 6px #64c8ff)',
        }}
      />

      {/* Animated inner circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r="8"
        fill="none"
        stroke="#ff00ff"
        strokeWidth="1.5"
        opacity="0.5"
        style={{
          animation: 'pulse-ring 2s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.3;
            r: 2;
          }
          50% {
            opacity: 1;
            r: 4;
          }
        }

        @keyframes pulse-ring {
          0%, 100% {
            r: 8;
            opacity: 0;
          }
          50% {
            r: 12;
            opacity: 0.5;
          }
        }
      `}</style>
    </svg>
  );
};
