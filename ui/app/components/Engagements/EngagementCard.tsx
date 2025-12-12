import React from 'react';
import { Engagement } from '../../pages/Engagements';

interface EngagementCardProps {
  engagement: Engagement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const EngagementCard: React.FC<EngagementCardProps> = ({
  engagement,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const taskCounts = {
    total: engagement.tasks.length,
    completed: engagement.tasks.filter((t) => t.status === 'Delivered').length,
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px',
        backgroundColor: isSelected
          ? 'var(--dt-colors-surface-accent-subtle)'
          : 'var(--dt-colors-surface-container-subtle)',
        border: `1px solid ${
          isSelected
            ? 'var(--dt-colors-border-accent-default)'
            : 'var(--dt-colors-border-container-default)'
        }`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--dt-colors-surface-container-default)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--dt-colors-surface-container-subtle)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {engagement.name}
          </div>
            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
              Client: {('clientName' in engagement ? (engagement as any).clientName : 'Unknown')} • {taskCounts.completed}/{taskCounts.total} tasks completed
            </div>
          {taskCounts.total > 0 && (
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--dt-colors-surface-container-default)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(taskCounts.completed / taskCounts.total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#4caf50',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete engagement "${engagement.name}"?`)) {
              onDelete();
            }
          }}
          style={{
            marginLeft: '8px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            opacity: 0.6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
