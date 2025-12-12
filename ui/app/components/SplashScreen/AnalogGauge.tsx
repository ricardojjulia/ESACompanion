import React, { useState, useEffect } from 'react';

interface AnalogGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

export const AnalogGauge: React.FC<AnalogGaugeProps> = ({ label, value, max, unit, color }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const percentage = (displayValue / max) * 100;
  const angle = (percentage / 100) * 270 - 135; // 270 degree range, starts at -135

  const width = 140;
  const height = 140;
  const radius = 60;
  const centerX = width / 2;
  const centerY = height / 2;

  // Create arc path
  const startAngle = (-135 * Math.PI) / 180;
  const endAngle = (135 * Math.PI) / 180;
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);

  // Create progress arc
  const progressEndAngle = ((angle * Math.PI) / 180);
  const progressEndX = centerX + radius * Math.cos(progressEndAngle);
  const progressEndY = centerY + radius * Math.sin(progressEndAngle);

  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const progressPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${progressEndX} ${progressEndY}`;

  // Needle
  const needleLength = radius - 15;
  const needleX = centerX + needleLength * Math.cos(progressEndAngle);
  const needleY = centerY + needleLength * Math.sin(progressEndAngle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
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

      {/* Gauge SVG */}
      <svg width={width} height={height} style={{ filter: 'drop-shadow(0 0 8px rgba(100, 200, 255, 0.3))' }}>
        {/* Background circle */}
        <circle cx={centerX} cy={centerY} r={radius + 10} fill="rgba(15, 20, 40, 0.8)" stroke="rgba(100, 200, 255, 0.1)" strokeWidth="1" />

        {/* Static arc */}
        <path d={arcPath} fill="none" stroke="rgba(100, 200, 255, 0.2)" strokeWidth="8" strokeLinecap="round" />

        {/* Progress arc */}
        <path
          d={progressPath}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'all 0.3s ease-out',
          }}
        />

        {/* Center dot */}
        <circle cx={centerX} cy={centerY} r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            transition: 'all 0.1s ease-out',
          }}
        />

        {/* Center needle joint */}
        <circle cx={centerX} cy={centerY} r="4" fill={color} />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = ((tick / 100) * 270 - 135) * (Math.PI / 180);
          const outerX = centerX + (radius + 5) * Math.cos(tickAngle);
          const outerY = centerY + (radius + 5) * Math.sin(tickAngle);
          const innerX = centerX + (radius - 3) * Math.cos(tickAngle);
          const innerY = centerY + (radius - 3) * Math.sin(tickAngle);

          return (
            <line
              key={`tick-${tick}`}
              x1={innerX}
              y1={innerY}
              x2={outerX}
              y2={outerY}
              stroke="rgba(100, 200, 255, 0.4)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Value display */}
      <div
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: color,
          textShadow: `0 0 10px ${color}`,
          letterSpacing: '1px',
        }}
      >
        {Math.round(displayValue)}{unit}
      </div>
    </div>
  );
};
