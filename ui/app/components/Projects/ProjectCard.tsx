import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { DeleteIcon } from '@dynatrace/strato-icons';
import { relativeDate } from '../../utils/dateUtils';
import type { Project } from '../../types/project';

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project, isSelected, onSelect, onDelete, canDelete,
}) => {
  const [hovered, setHovered] = useState(false);

  const completed = project.tasks.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
  const stalled = project.tasks.filter((t) => t.status === 'Stalled').length;
  const total = project.tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const expDate = relativeDate(project.expectedDate, pct === 100);

  const accentColor = stalled > 0 ? '#f59e0b' : pct >= 80 ? '#10b981' : isSelected ? '#3b82f6' : '#6366f1';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: `1px solid ${isSelected ? accentColor : 'var(--dt-colors-border-container-default)'}`,
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: isSelected
          ? accentColor + '0d'
          : hovered
          ? 'var(--dt-colors-surface-container-subtle)'
          : 'var(--dt-colors-surface-container-default)',
        transition: 'all 0.12s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px', fontWeight: isSelected ? 700 : 600,
              marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: isSelected ? accentColor : 'var(--dt-colors-text-primary)',
            }}
          >
            {project.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.clientName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', color: expDate.color, fontWeight: expDate.isOverdue ? 600 : 400 }}>
              {expDate.text}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: accentColor }}>{pct}%</span>
          </div>
          {total > 0 && (
            <div style={{ height: '3px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: accentColor, borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
          )}
          {stalled > 0 && (
            <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>
              ⊘ {stalled} stalled
            </div>
          )}
        </div>
        {canDelete && (hovered || isSelected) && (
          <Tooltip text="Delete project">
            <Button
              aria-label="Delete project"
              size="condensed" color="critical"
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${project.name}"?`)) onDelete(); }}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
