import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Select } from '@dynatrace/strato-components-preview/forms';
import { DeleteIcon, EditIcon } from '@dynatrace/strato-icons';
import { StatusBadge, STATUS_COLORS } from '../ui/StatusBadge';
import { relativeDate } from '../../utils/dateUtils';
import type { Comment, Milestone, Objective, Task, TaskStatus } from '../../types/project';

const STATUS_ORDER: TaskStatus[] = ['Not Started', 'In Progress', 'Stalled', 'Finished', 'Delivered'];

const OWNER_CFG: Record<string, { color: string; abbrev: string }> = {
  Architect: { color: '#3b82f6', abbrev: 'A' },
  Client:    { color: '#10b981', abbrev: 'C' },
  Both:      { color: '#8b5cf6', abbrev: '±' },
};

// Circular avatar-style owner indicator (inspired by Linear's assignee design)
const OwnerAvatar: React.FC<{ owner: string }> = ({ owner }) => {
  const cfg = OWNER_CFG[owner] ?? { color: '#64748b', abbrev: owner[0] ?? '?' };
  return (
    <span
      title={`Owner: ${owner}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '50%',
        backgroundColor: cfg.color + '20',
        border: `1.5px solid ${cfg.color}`,
        color: cfg.color,
        fontSize: '8px', fontWeight: 700, flexShrink: 0,
        letterSpacing: '-0.5px',
      }}
    >
      {cfg.abbrev}
    </span>
  );
};

// ── Task Row (Linear-style) ──────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  objective?: Objective;
  milestone?: Milestone;
  isNew: boolean;
  onUpdateStatus: (status: TaskStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onAcknowledge: () => void;
  canManage: boolean;
  canUpdateStatus: boolean;
  isManager: boolean;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task, objective, milestone, isNew,
  onUpdateStatus, onDelete, onEdit, onAddComment, onDeleteComment, onAcknowledge,
  canManage, canUpdateStatus, isManager,
}) => {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const allComments: Comment[] = task.comments ?? (task.notes ?? []).map((n) => ({ ...n, role: 'Architect' as const }));
  const clientComments = allComments.filter((c) => c.role === 'Client');
  const subtasksTotal = (task.subtasks ?? []).length;
  const subtasksDone = (task.subtasks ?? []).filter((s) => s.status === 'Delivered' || s.status === 'Finished').length;
  const canAcknowledge = !isManager && (task.status === 'Delivered' || task.status === 'Finished') && !task.acknowledgedAt;
  const isArchitectOnly = task.visibility === 'architect-only';
  const isComplete = task.status === 'Delivered' || task.status === 'Finished';
  const date = relativeDate(task.dueDate, isComplete);

  return (
    <div>
      {/* Main row */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 14px',
          cursor: 'pointer',
          backgroundColor: date.isOverdue
            ? 'rgba(239,68,68,0.04)'
            : hovered
            ? 'var(--dt-colors-surface-container-subtle)'
            : 'transparent',
          borderLeft: expanded ? '3px solid var(--dt-colors-border-container-default)' : '3px solid transparent',
          transition: 'background-color 0.12s ease',
          borderBottom: '1px solid var(--dt-colors-border-container-default)',
        }}
      >
        {/* Status badge (fixed width, left anchor) */}
        <div style={{ flexShrink: 0, width: '110px' }} onClick={() => setExpanded(!expanded)}>
          <StatusBadge status={task.status} size="sm" />
        </div>

        {/* Title + meta (click to expand) */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: isComplete && task.acknowledgedAt ? 'line-through' : 'none',
                opacity: isComplete && task.acknowledgedAt ? 0.6 : 1,
              }}
            >
              {task.title}
            </span>
            {isNew && (
              <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '999px', letterSpacing: '0.3px' }}>
                NEW
              </span>
            )}
            {task.owner && <OwnerAvatar owner={task.owner} />}
            {isArchitectOnly && isManager && (
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--dt-colors-text-secondary)', border: '1px solid var(--dt-colors-border-container-default)', padding: '1px 5px', borderRadius: '999px' }}>
                Internal
              </span>
            )}
            {task.acknowledgedAt && (
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#34d399' }}>✓ Signed off</span>
            )}
            {clientComments.length > 0 && isManager && (
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#10b981' }}>
                💬 {clientComments.length}
              </span>
            )}
          </div>
          {/* Secondary metadata row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '11px', color: 'var(--dt-colors-text-secondary)', flexWrap: 'wrap' }}>
            {objective && <span>{objective.title}</span>}
            {milestone && <span>🏁 {milestone.title}</span>}
            {subtasksTotal > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Mini subtask progress bar */}
                <span style={{ display: 'inline-block', width: '28px', height: '3px', backgroundColor: 'var(--dt-colors-border-container-default)', borderRadius: '2px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0}%`, backgroundColor: '#34d399', borderRadius: '2px' }} />
                </span>
                {subtasksDone}/{subtasksTotal}
              </span>
            )}
            {allComments.length > 0 && (
              <span>💬 {allComments.length}</span>
            )}
          </div>
        </div>

        {/* Right side: date + actions (actions visible on hover) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Due date chip */}
          {task.dueDate && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: date.isOverdue ? 600 : 400,
                color: date.color,
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: date.isOverdue ? 'rgba(239,68,68,0.1)' : 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {date.text}
            </span>
          )}

          {/* Actions — revealed on hover (opacity transition) */}
          <div
            style={{
              display: 'flex', gap: '4px', alignItems: 'center',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s ease-out',
              pointerEvents: hovered ? 'auto' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {canAcknowledge && (
              <Button variant="emphasized" size="condensed" onClick={onAcknowledge}>Sign off</Button>
            )}
            <Button
              size="condensed"
              variant={expanded ? 'emphasized' : 'default'}
              onClick={() => setExpanded(!expanded)}
            >
              💬{allComments.length > 0 ? ` ${allComments.length}` : ''}
            </Button>
            {canManage && (
              <>
                <Button aria-label="Edit" size="condensed" onClick={onEdit}><EditIcon /></Button>
                <Button aria-label="Delete" size="condensed" color="critical" onClick={onDelete}><DeleteIcon /></Button>
              </>
            )}
          </div>

          {/* Collapse indicator */}
          <span
            style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', opacity: 0.6, userSelect: 'none', padding: '2px' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          style={{
            padding: '14px 14px 14px 137px', // indent to align with title column
            backgroundColor: 'var(--dt-colors-surface-container-subtle)',
            borderBottom: '1px solid var(--dt-colors-border-container-default)',
          }}
        >
          {task.description && (
            <p style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)', marginBottom: '14px' }}>
              {task.description}
            </p>
          )}

          {/* Status picker + date (in expanded view) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                aria-label="Task status"
                value={task.status}
                disabled={!canUpdateStatus}
                onChange={(v) => onUpdateStatus(v as TaskStatus)}
              >
                <Select.Content>
                  {STATUS_ORDER.map((s) => (
                    <Select.Option key={s} value={s}>{s}</Select.Option>
                  ))}
                </Select.Content>
              </Select>
            </div>
            {canAcknowledge && (
              <Button variant="emphasized" size="condensed" onClick={onAcknowledge}>
                ✓ Sign off this delivery
              </Button>
            )}
          </div>

          {/* Subtasks */}
          {subtasksTotal > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Subtasks
              </div>
              {(task.subtasks ?? []).map((sub) => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: STATUS_COLORS[sub.status] ?? '#64748b', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{sub.title}</span>
                  {sub.dueDate && <span style={{ color: 'var(--dt-colors-text-secondary)' }}>{new Date(sub.dueDate).toLocaleDateString()}</span>}
                  <span style={{ color: STATUS_COLORS[sub.status] ?? 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>{sub.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Comments
            </div>
            {allComments.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '10px' }}>No comments yet.</div>
            )}
            {allComments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  marginBottom: '8px', padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: comment.role === 'Client' ? 'rgba(16,185,129,0.07)' : 'rgba(59,130,246,0.06)',
                  borderLeft: `3px solid ${comment.role === 'Client' ? '#10b981' : '#3b82f6'}`,
                }}
              >
                {/* Role avatar */}
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: comment.role === 'Client' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                  border: `1.5px solid ${comment.role === 'Client' ? '#10b981' : '#3b82f6'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700,
                  color: comment.role === 'Client' ? '#10b981' : '#3b82f6',
                }}>
                  {comment.role === 'Client' ? 'C' : 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: comment.role === 'Client' ? '#10b981' : '#3b82f6' }}>
                      {comment.role}
                    </span>
                    {comment.author && <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>{comment.author}</span>}
                    <span style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', marginLeft: 'auto' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px' }}>{comment.text}</div>
                </div>
                <Button size="condensed" color="critical" onClick={() => onDeleteComment(comment.id)}>✕</Button>
              </div>
            ))}

            {/* Comment input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="text"
                placeholder={`Add a comment as ${isManager ? 'Architect' : 'Client'}… (Enter)`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    onAddComment(commentText.trim());
                    setCommentText('');
                  }
                }}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: '6px',
                  border: '1px solid var(--dt-colors-border-container-default)',
                  backgroundColor: 'var(--dt-colors-surface-container-default)',
                  color: 'var(--dt-colors-text-primary)', fontSize: '13px',
                }}
              />
              <Button
                disabled={!commentText.trim()}
                onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(''); } }}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Kanban Card (column-based) ────────────────────────────────────────────────

const KanbanCard: React.FC<{
  task: Task;
  objective?: Objective;
  milestone?: Milestone;
  isNew: boolean;
  onUpdateStatus: (status: TaskStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onAcknowledge: () => void;
  canManage: boolean;
  isManager: boolean;
}> = ({ task, objective, milestone, isNew, onDelete, onEdit, onAcknowledge, canManage, isManager }) => {
  const [hovered, setHovered] = useState(false);
  const date = relativeDate(task.dueDate, task.status === 'Delivered' || task.status === 'Finished');
  const allComments: Comment[] = task.comments ?? (task.notes ?? []).map((n) => ({ ...n, role: 'Architect' as const }));
  const canAcknowledge = !isManager && (task.status === 'Delivered' || task.status === 'Finished') && !task.acknowledgedAt;
  const subtasksTotal = (task.subtasks ?? []).length;
  const subtasksDone = (task.subtasks ?? []).filter((s) => s.status === 'Delivered' || s.status === 'Finished').length;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--dt-colors-border-container-default)',
        backgroundColor: 'var(--dt-colors-surface-container-default)',
        marginBottom: '8px',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
        transition: 'box-shadow 0.15s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, minWidth: 0 }}>{task.title}</span>
        {isNew && (
          <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '999px', marginLeft: '6px', flexShrink: 0 }}>
            NEW
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {task.owner && <OwnerAvatar owner={task.owner} />}
        {task.acknowledgedAt && <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 600 }}>✓ Signed off</span>}
        {task.visibility === 'architect-only' && isManager && (
          <span style={{ fontSize: '9px', color: 'var(--dt-colors-text-secondary)', border: '1px solid var(--dt-colors-border-container-default)', padding: '1px 4px', borderRadius: '999px' }}>
            Internal
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
        <div style={{ color: date.color, fontWeight: date.isOverdue ? 600 : 400 }}>{date.text}</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--dt-colors-text-secondary)' }}>
          {subtasksTotal > 0 && <span>{subtasksDone}/{subtasksTotal}</span>}
          {allComments.length > 0 && <span>💬 {allComments.length}</span>}
        </div>
      </div>

      {(objective || milestone) && (
        <div style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', marginTop: '4px', opacity: 0.8 }}>
          {objective?.title}{milestone ? ` · 🏁 ${milestone.title}` : ''}
        </div>
      )}

      {/* Hover actions */}
      {hovered && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
          {canAcknowledge && <Button variant="emphasized" size="condensed" onClick={onAcknowledge}>Sign off</Button>}
          {canManage && (
            <>
              <Button aria-label="Edit" size="condensed" onClick={onEdit}><EditIcon /></Button>
              <Button aria-label="Delete" size="condensed" color="critical" onClick={onDelete}><DeleteIcon /></Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Container ─────────────────────────────────────────────────────────────────

interface TasksByStatusProps {
  tasks: Task[];
  viewMode: 'list' | 'kanban';
  objectives: Objective[];
  milestones: Milestone[];
  lastVisit: number;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onAcknowledge: (taskId: string) => void;
  canManage: boolean;
  canUpdateStatus: boolean;
  isManager: boolean;
}

export const TasksByStatus: React.FC<TasksByStatusProps> = ({
  tasks, viewMode, objectives, milestones, lastVisit,
  onUpdateStatus, onDeleteTask, onEditTask, onAddComment, onDeleteComment, onAcknowledge,
  canManage, canUpdateStatus, isManager,
}) => {
  const visibleTasks = isManager ? tasks : tasks.filter((t) => t.visibility !== 'architect-only');
  const isNew = (t: Task) => lastVisit > 0 && new Date(t.updatedAt ?? t.createdAt).getTime() > lastVisit;

  const commonRowProps = (task: Task) => ({
    task,
    objective: objectives.find((o) => o.id === task.objectiveId),
    milestone: milestones.find((m) => m.id === task.milestoneId),
    isNew: isNew(task),
    onUpdateStatus: (s: TaskStatus) => onUpdateStatus(task.id, s),
    onDelete: () => onDeleteTask(task.id),
    onEdit: () => onEditTask(task),
    onAddComment: (text: string) => onAddComment(task.id, text),
    onDeleteComment: (id: string) => onDeleteComment(task.id, id),
    onAcknowledge: () => onAcknowledge(task.id),
    canManage,
    canUpdateStatus,
    isManager,
  });

  if (viewMode === 'kanban') {
    const groups = STATUS_ORDER.map((status) => ({
      status,
      tasks: visibleTasks.filter((t) => t.status === status),
    }));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', gap: '12px', overflowX: 'auto' }}>
        {groups.map(({ status, tasks: col }) => (
          <div key={status}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '0 2px' }}>
              <StatusBadge status={status} size="sm" />
              <span style={{
                fontSize: '11px', fontWeight: 700,
                backgroundColor: 'var(--dt-colors-surface-container-subtle)',
                color: 'var(--dt-colors-text-secondary)',
                padding: '1px 7px', borderRadius: '999px',
              }}>
                {col.length}
              </span>
            </div>
            {col.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--dt-colors-border-container-default)', borderRadius: '8px' }}>
                Empty
              </div>
            ) : (
              col.map((task) => (
                <KanbanCard key={task.id} {...commonRowProps(task)} />
              ))
            )}
          </div>
        ))}
      </div>
    );
  }

  // List view — grouped by status with row-based design
  const groups = STATUS_ORDER.map((status) => ({
    status,
    tasks: visibleTasks.filter((t) => t.status === status),
  })).filter(({ tasks: g }) => g.length > 0);

  if (groups.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--dt-colors-text-secondary)', fontSize: '14px', border: '1px dashed var(--dt-colors-border-container-default)', borderRadius: '8px' }}>
        No tasks yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {groups.map(({ status, tasks: group }) => (
        <div key={status}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', padding: '0 14px' }}>
            <StatusBadge status={status} />
            <span style={{
              fontSize: '11px', fontWeight: 700,
              backgroundColor: 'var(--dt-colors-surface-container-subtle)',
              color: 'var(--dt-colors-text-secondary)',
              padding: '1px 8px', borderRadius: '999px',
            }}>
              {group.length}
            </span>
          </div>
          <Surface elevation="flat" style={{ overflow: 'hidden', padding: 0 }}>
            {group.map((task) => (
              <TaskRow key={task.id} {...commonRowProps(task)} />
            ))}
          </Surface>
        </div>
      ))}
    </div>
  );
};
