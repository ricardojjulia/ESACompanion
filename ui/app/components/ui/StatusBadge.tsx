import React from 'react';
import type { TaskStatus } from '../../types/project';

// Symbol grammar: shape encodes meaning (inspired by Linear's status icon system)
const STATUS_CFG: Record<TaskStatus, { color: string; symbol: string }> = {
  'Not Started': { color: '#94a3b8', symbol: '○' },
  'In Progress': { color: '#60a5fa', symbol: '◑' },
  'Stalled':     { color: '#fbbf24', symbol: '⊘' },
  'Finished':    { color: '#34d399', symbol: '✓' },
  'Delivered':   { color: '#a78bfa', symbol: '⬆' },
};

export const STATUS_COLORS: Record<TaskStatus, string> = Object.fromEntries(
  Object.entries(STATUS_CFG).map(([k, v]) => [k, v.color])
) as Record<TaskStatus, string>;

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

// Pill with low-opacity tinted background matching the text color — same pattern as Linear/Jira labels
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['Not Started'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '3px 9px',
        borderRadius: '999px',
        backgroundColor: cfg.color + '1a', // ~10% opacity tint
        color: cfg.color,
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        letterSpacing: '0.1px',
      }}
    >
      <span style={{ fontSize: size === 'sm' ? '9px' : '10px' }}>{cfg.symbol}</span>
      {status}
    </span>
  );
};

// Compact dot-only indicator for table/dense views
export const StatusDot: React.FC<{ status: TaskStatus; size?: number }> = ({ status, size = 8 }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['Not Started'];
  return (
    <span
      title={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: cfg.color,
        flexShrink: 0,
      }}
    />
  );
};
