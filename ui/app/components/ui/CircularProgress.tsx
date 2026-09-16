import React from 'react';

interface CircularProgressProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

// SVG circular progress ring — premium alternative to a progress bar for project-level completion
export const CircularProgress: React.FC<CircularProgressProps> = ({
  pct,
  size = 64,
  strokeWidth = 5,
  color = '#6366f1',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(Math.max(pct, 0), 100) / 100 * circ;
  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={center} cy={center} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Fill */}
        <circle
          cx={center} cy={center} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.45s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1px',
        }}
      >
        <span style={{ fontSize: size / 4.2, fontWeight: 700, color, lineHeight: 1 }}>
          {label ?? `${pct}%`}
        </span>
        {sublabel && (
          <span style={{ fontSize: size / 7, color: 'var(--dt-colors-text-secondary)', lineHeight: 1 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
