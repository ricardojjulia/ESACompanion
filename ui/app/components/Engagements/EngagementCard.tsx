import React from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { DeleteIcon } from '@dynatrace/strato-icons';
import { Engagement } from '../../pages/Engagements';

interface EngagementCardProps {
  engagement: Engagement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const EngagementCard: React.FC<EngagementCardProps> = ({
  engagement,
  isSelected,
  onSelect,
  onDelete,
  canDelete,
}) => {
  const taskCounts = {
    total: engagement.tasks.length,
    completed: engagement.tasks.filter((t) => t.status === 'Delivered').length,
  };

  return (
    <Surface
      elevation={isSelected ? 'raised' : 'flat'}
      selected={isSelected}
      color="primary"
      onClick={onSelect}
      style={{
        padding: '12px',
        cursor: 'pointer',
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
                  backgroundColor: 'var(--dt-colors-background-success-default)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
        {canDelete && (
          <Tooltip text="Delete engagement">
            <Button
              aria-label="Delete engagement"
              size="condensed"
              color="critical"
              onClick={(event) => {
                event.stopPropagation();
                if (confirm(`Delete engagement "${engagement.name}"`)) onDelete();
              }}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        )}
      </div>
    </Surface>
  );
};
