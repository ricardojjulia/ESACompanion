import React, { useState, useEffect } from 'react';

export const OscilloscopeWave: React.FC = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => (t + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const width = 450;
  const height = 100;
  const centerY = height / 2;
  const amplitude = 30;
  const frequency = 0.02;

  // Generate wave points
  const points: Array<[number, number]> = [];
  for (let x = 0; x < width; x += 2) {
    const adjustedX = (x + time * 2) % width;
    const y = centerY + amplitude * Math.sin(adjustedX * frequency + (time * Math.PI) / 180);
    points.push([adjustedX, y]);
  }

  // Create SVG path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  // Create secondary wave
  const points2: Array<[number, number]> = [];
  for (let x = 0; x < width; x += 2) {
    const adjustedX = (x + time * 1.5 + 50) % width;
    const y = centerY + amplitude * 0.6 * Math.sin(adjustedX * frequency * 1.3 + (time * Math.PI) / 150);
    points2.push([adjustedX, y]);
  }
  const pathData2 = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
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
        System Activity
      </div>

      {/* Oscilloscope display */}
      <div
        style={{
          backgroundColor: 'rgba(0, 20, 40, 0.6)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '6px',
          padding: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid background */}
        <svg
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.1,
          }}
        >
          {/* Vertical lines */}
          {[...Array(10)].map((_, i) => (
            <line
              key={`vline-${i}`}
              x1={(i * width) / 10}
              y1="0"
              x2={(i * width) / 10}
              y2={height}
              stroke="#00ffff"
              strokeWidth="1"
            />
          ))}
          {/* Horizontal lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`hline-${i}`}
              x1="0"
              y1={(i * height) / 5}
              x2={width}
              y2={(i * height) / 5}
              stroke="#00ffff"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Waves */}
        <svg width={width} height={height} style={{ position: 'relative', zIndex: 1 }}>
          {/* Primary wave */}
          <path
            d={pathData}
            fill="none"
            stroke="#64c8ff"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 0 4px #64c8ff)',
            }}
          />

          {/* Secondary wave */}
          <path
            d={pathData2}
            fill="none"
            stroke="#ff00ff"
            strokeWidth="1.5"
            opacity="0.7"
            style={{
              filter: 'drop-shadow(0 0 3px #ff00ff)',
            }}
          />

          {/* Center line */}
          <line
            x1="0"
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke="rgba(100, 200, 255, 0.2)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        </svg>
      </div>

      {/* Info text */}
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
        }}
      >
        Real-time system monitoring
      </div>
    </div>
  );
};
