import React, { useState, useEffect } from 'react';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Button } from '@dynatrace/strato-components/buttons';
import { EmptyState } from '@dynatrace/strato-components-preview/content';
import { Select } from '@dynatrace/strato-components-preview/forms';
import { StatusBadge, STATUS_COLORS } from '../components/ui/StatusBadge';
import { CircularProgress } from '../components/ui/CircularProgress';
import { relativeDate } from '../utils/dateUtils';
import type { Comment, Milestone, Project, Task, TaskStatus } from '../types/project';

const STORAGE_KEY = 'esa-engagements';
const STATUS_ORDER: TaskStatus[] = ['Not Started', 'In Progress', 'Stalled', 'Finished', 'Delivered'];

const OWNER_CFG: Record<string, { color: string; abbrev: string }> = {
  Architect: { color: '#3b82f6', abbrev: 'A' },
  Client:    { color: '#10b981', abbrev: 'C' },
  Both:      { color: '#8b5cf6', abbrev: '±' },
};

const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: any) => ({
      ...p,
      tasks: (p.tasks ?? []).map((t: any) => ({
        ...t,
        projectId: t.projectId ?? t.engagementId ?? p.id,
        subtasks: t.subtasks ?? [],
        comments: t.comments ?? (t.notes ?? []).map((n: any) => ({ ...n, role: 'Architect' as const })),
        visibility: t.visibility ?? 'all',
        owner: t.owner ?? 'Architect',
      })),
      milestones: p.milestones ?? [],
      objectives: p.objectives ?? [],
    }));
  } catch { return []; }
};

const saveProjects = (projects: Project[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

// ── Owner Avatar ─────────────────────────────────────────────────────────────

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
        color: cfg.color, fontSize: '8px', fontWeight: 700, flexShrink: 0,
      }}
    >
      {cfg.abbrev}
    </span>
  );
};

// ── Task Row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  milestone?: Milestone;
  isNew: boolean;
  isManager: boolean;
  onUpdateStatus: (status: TaskStatus) => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onAcknowledge: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task, milestone, isNew, isManager,
  onUpdateStatus, onAddComment, onDeleteComment, onAcknowledge,
}) => {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const allComments: Comment[] = task.comments ?? (task.notes ?? []).map((n) => ({ ...n, role: 'Architect' as const }));
  const clientComments = allComments.filter((c) => c.role === 'Client');
  const subtasksDone = (task.subtasks ?? []).filter((s) => s.status === 'Delivered' || s.status === 'Finished').length;
  const subtasksTotal = (task.subtasks ?? []).length;
  const canAcknowledge = !isManager && (task.status === 'Delivered' || task.status === 'Finished') && !task.acknowledgedAt;
  const isComplete = task.status === 'Delivered' || task.status === 'Finished';
  const date = relativeDate(task.dueDate, isComplete);

  return (
    <div>
      {/* Main row — hover-state pattern from Linear */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
          cursor: 'pointer',
          backgroundColor: date.isOverdue ? 'rgba(239,68,68,0.04)' : hovered ? 'var(--dt-colors-surface-container-subtle)' : 'transparent',
          borderLeft: expanded ? '3px solid var(--dt-colors-border-container-default)' : '3px solid transparent',
          transition: 'background-color 0.12s ease',
          borderBottom: '1px solid var(--dt-colors-border-container-default)',
        }}
      >
        {/* Status badge — fixed width */}
        <div style={{ flexShrink: 0, width: '110px' }} onClick={() => setExpanded(!expanded)}>
          <StatusBadge status={task.status} size="sm" />
        </div>

        {/* Title + metadata */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, textDecoration: isComplete && task.acknowledgedAt ? 'line-through' : 'none', opacity: isComplete && task.acknowledgedAt ? 0.6 : 1 }}>
              {task.title}
            </span>
            {isNew && <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '999px' }}>NEW</span>}
            {task.owner && <OwnerAvatar owner={task.owner} />}
            {task.acknowledgedAt && <span style={{ fontSize: '9px', fontWeight: 600, color: '#34d399' }}>✓ Signed off</span>}
            {clientComments.length > 0 && isManager && <span style={{ fontSize: '9px', fontWeight: 600, color: '#10b981' }}>💬 {clientComments.length} client</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '11px', color: 'var(--dt-colors-text-secondary)', flexWrap: 'wrap' }}>
            {milestone && <span>🏁 {milestone.title}</span>}
            {subtasksTotal > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '28px', height: '3px', backgroundColor: 'var(--dt-colors-border-container-default)', borderRadius: '2px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${(subtasksDone / subtasksTotal) * 100}%`, backgroundColor: '#34d399', borderRadius: '2px' }} />
                </span>
                {subtasksDone}/{subtasksTotal}
              </span>
            )}
            {allComments.length > 0 && <span>💬 {allComments.length}</span>}
          </div>
        </div>

        {/* Right: due date chip + actions (revealed on hover) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {task.dueDate && (
            <span style={{
              fontSize: '11px', fontWeight: date.isOverdue ? 600 : 400, color: date.color,
              padding: '2px 7px', borderRadius: '999px',
              backgroundColor: date.isOverdue ? 'rgba(239,68,68,0.1)' : 'transparent',
              whiteSpace: 'nowrap',
            }}>
              {date.text}
            </span>
          )}
          <div
            style={{ display: 'flex', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease-out', pointerEvents: hovered ? 'auto' : 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {canAcknowledge && <Button variant="emphasized" size="condensed" onClick={onAcknowledge}>Sign off ✓</Button>}
            <Button size="condensed" variant={expanded ? 'emphasized' : 'default'} onClick={() => setExpanded(!expanded)}>
              💬{allComments.length > 0 ? ` ${allComments.length}` : ''}
            </Button>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', opacity: 0.5, userSelect: 'none', padding: '2px' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '14px 14px 14px 137px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
          {task.description && <p style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)', marginBottom: '14px' }}>{task.description}</p>}

          {/* Status changer */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
            <Select aria-label="Task status" value={task.status} onChange={(v) => onUpdateStatus(v as TaskStatus)}>
              <Select.Content>
                {STATUS_ORDER.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select.Content>
            </Select>
            {canAcknowledge && <Button variant="emphasized" size="condensed" onClick={onAcknowledge}>✓ Sign off this delivery</Button>}
          </div>

          {/* Subtasks */}
          {subtasksTotal > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Subtasks</div>
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
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Comments</div>
            {allComments.length === 0 && <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '10px' }}>No comments yet.</div>}
            {allComments.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px',
                  padding: '9px 12px', borderRadius: '8px',
                  backgroundColor: c.role === 'Client' ? 'rgba(16,185,129,0.07)' : 'rgba(59,130,246,0.06)',
                  borderLeft: `3px solid ${c.role === 'Client' ? '#10b981' : '#3b82f6'}`,
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, backgroundColor: c.role === 'Client' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', border: `1.5px solid ${c.role === 'Client' ? '#10b981' : '#3b82f6'}`, color: c.role === 'Client' ? '#10b981' : '#3b82f6' }}>
                  {c.role === 'Client' ? 'C' : 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: c.role === 'Client' ? '#10b981' : '#3b82f6' }}>{c.role}</span>
                    {c.author && <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>{c.author}</span>}
                    <span style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', marginLeft: 'auto' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '13px' }}>{c.text}</div>
                </div>
                <Button size="condensed" color="critical" onClick={() => onDeleteComment(c.id)}>✕</Button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="text" placeholder={`Add a comment as ${isManager ? 'Architect' : 'Client'}… (Enter)`}
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) { onAddComment(commentText.trim()); setCommentText(''); } }}
                style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--dt-colors-border-container-default)', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '13px' }}
              />
              <Button disabled={!commentText.trim()} onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(''); } }}>Post</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  isManager: boolean;
  lastVisit: number;
  onUpdateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  onAddComment: (projectId: string, taskId: string, text: string) => void;
  onDeleteComment: (projectId: string, taskId: string, commentId: string) => void;
  onAcknowledge: (projectId: string, taskId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project, isManager, lastVisit,
  onUpdateTaskStatus, onAddComment, onDeleteComment, onAcknowledge,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending-signoff'>('all');

  const visibleTasks = isManager ? project.tasks : project.tasks.filter((t) => t.visibility !== 'architect-only');
  const total = visibleTasks.length;
  const completedCount = visibleTasks.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
  const stalledCount = visibleTasks.filter((t) => t.status === 'Stalled').length;
  const awaitingSignOff = visibleTasks.filter((t) => (t.status === 'Delivered' || t.status === 'Finished') && !t.acknowledgedAt).length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isOverdue = project.expectedDate && new Date(project.expectedDate) < new Date() && pct < 100;
  const isNew = (t: Task) => lastVisit > 0 && new Date(t.updatedAt ?? t.createdAt).getTime() > lastVisit;
  const expDate = relativeDate(project.expectedDate, pct === 100);

  const ringColor = stalledCount > 0 ? '#f59e0b' : pct >= 80 ? '#10b981' : '#6366f1';
  const cardAccent = ringColor;

  const filteredTasks = visibleTasks.filter((t) => {
    if (filter === 'mine') return t.owner === 'Client' || t.owner === 'Both';
    if (filter === 'pending-signoff') return (t.status === 'Delivered' || t.status === 'Finished') && !t.acknowledgedAt;
    return true;
  });

  // Status distribution for mini stacked bar
  const statusCounts = STATUS_ORDER.map((s) => ({
    status: s,
    count: visibleTasks.filter((t) => t.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((s) => s.count > 0);

  return (
    <Surface elevation="flat" style={{ marginBottom: '16px', overflow: 'hidden', borderLeft: `4px solid ${cardAccent}` }}>
      {/* Project header */}
      <div style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Circular progress ring — premium alternative to % text */}
          <div onClick={(e) => e.stopPropagation()}>
            <CircularProgress
              pct={pct} size={64} strokeWidth={5}
              color={ringColor}
              trackColor="var(--dt-colors-surface-container-subtle)"
            />
          </div>

          {/* Project info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{project.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginTop: '2px' }}>
                  {project.clientName}
                  {project.expectedDate && (
                    <> · <span style={{ color: expDate.color, fontWeight: expDate.isOverdue ? 600 : 400 }}>
                      {expDate.text}{expDate.isOverdue ? '' : ''}
                    </span></>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', opacity: 0.5, userSelect: 'none', marginLeft: '8px' }}>
                {expanded ? '▲' : '▼'}
              </span>
            </div>

            {/* Stacked status distribution bar */}
            {total > 0 && (
              <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px', gap: '1px' }}>
                {statusCounts.map(({ status, count, color }) => (
                  <div
                    key={status} title={`${count} ${status}`}
                    style={{ height: '100%', flex: count, backgroundColor: color, minWidth: '3px' }}
                  />
                ))}
              </div>
            )}

            {/* Status pills row */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {statusCounts.map(({ status, count }) => (
                <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--dt-colors-text-secondary)', padding: '1px 6px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '999px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: STATUS_COLORS[status as TaskStatus], flexShrink: 0 }} />
                  {count} {status}
                </span>
              ))}
              {awaitingSignOff > 0 && !isManager && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', padding: '1px 6px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '999px' }}>
                  ✓ {awaitingSignOff} to sign off
                </span>
              )}
              {(project.milestones ?? []).length > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--dt-colors-text-secondary)', padding: '1px 6px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '999px' }}>
                  🏁 {(project.milestones ?? []).filter((m) => m.completedAt).length}/{(project.milestones ?? []).length} milestones
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--dt-colors-border-container-default)' }}>
          {/* Milestones */}
          {(project.milestones ?? []).length > 0 && (
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Milestones</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(project.milestones ?? []).map((ms) => (
                  <span
                    key={ms.id}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                      border: `1px solid ${ms.completedAt ? '#10b981' : '#6366f1'}`,
                      color: ms.completedAt ? '#34d399' : 'var(--dt-colors-text-primary)',
                    }}
                  >
                    {ms.completedAt ? '✓ ' : '🏁 '}{ms.title}
                    {ms.dueDate && !ms.completedAt && (
                      <span style={{ color: 'var(--dt-colors-text-secondary)', marginLeft: '6px', fontSize: '11px' }}>
                        {new Date(ms.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter tabs (client only) */}
          {!isManager && (
            <div style={{ padding: '10px 18px', display: 'flex', gap: '6px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
              {([['all', 'All Tasks'], ['mine', 'My Tasks'], ['pending-signoff', 'Awaiting Sign-off']] as [string, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val as typeof filter)}
                  style={{
                    padding: '4px 10px', borderRadius: '999px', cursor: 'pointer', fontSize: '12px',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    backgroundColor: filter === val ? ringColor + '20' : 'transparent',
                    color: filter === val ? ringColor : 'var(--dt-colors-text-primary)',
                    fontWeight: filter === val ? 700 : 400,
                    transition: 'all 0.12s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Task list */}
          <div>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: '20px 18px', fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>No tasks match this filter.</div>
            ) : (
              filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  milestone={(project.milestones ?? []).find((m) => m.id === task.milestoneId)}
                  isNew={isNew(task)}
                  isManager={isManager}
                  onUpdateStatus={(status) => onUpdateTaskStatus(project.id, task.id, status)}
                  onAddComment={(text) => onAddComment(project.id, task.id, text)}
                  onDeleteComment={(id) => onDeleteComment(project.id, task.id, id)}
                  onAcknowledge={() => onAcknowledge(project.id, task.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </Surface>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

export const ProjectDashboard = ({ isManager }: { isManager: boolean }) => {
  const LAST_VISIT_KEY = `esa-last-visit-${isManager ? 'architect' : 'client'}`;
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterClient, setFilterClient] = useState('');
  const [sortBy, setSortBy] = useState<'progress' | 'name' | 'client' | 'expected'>('progress');
  const [lastVisit] = useState<number>(() => {
    const prev = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    return prev;
  });

  useEffect(() => { setProjects(loadProjects()); }, []);

  const persist = (next: Project[]) => { setProjects(next); saveProjects(next); };

  const handleUpdateTaskStatus = (projectId: string, taskId: string, status: TaskStatus) => {
    persist(projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t) }
        : p
    ));
  };

  const handleAddComment = (projectId: string, taskId: string, text: string) => {
    const comment: Comment = { id: `cmt-${Date.now()}`, text, createdAt: new Date().toISOString(), role: isManager ? 'Architect' : 'Client' };
    persist(projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, comments: [...(t.comments ?? []), comment], updatedAt: new Date().toISOString() } : t) }
        : p
    ));
  };

  const handleDeleteComment = (projectId: string, taskId: string, commentId: string) => {
    persist(projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId) } : t) }
        : p
    ));
  };

  const handleAcknowledge = (projectId: string, taskId: string) => {
    persist(projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, acknowledgedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : t) }
        : p
    ));
  };

  const uniqueClients = [...new Set(projects.map((p) => p.clientName))].sort();
  const filtered = filterClient ? projects.filter((p) => p.clientName === filterClient) : projects;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'client') return a.clientName.localeCompare(b.clientName);
    if (sortBy === 'expected') {
      return (a.expectedDate ? new Date(a.expectedDate).getTime() : Infinity)
        - (b.expectedDate ? new Date(b.expectedDate).getTime() : Infinity);
    }
    const vis = (p: Project) => isManager ? p.tasks : p.tasks.filter((t) => t.visibility !== 'architect-only');
    const pct = (p: Project) => { const v = vis(p); return v.length ? (v.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length / v.length) : 0; };
    return pct(a) - pct(b);
  });

  const allVisible = projects.flatMap((p) => isManager ? p.tasks : p.tasks.filter((t) => t.visibility !== 'architect-only'));
  const totalTasks = allVisible.length;
  const completedTasks = allVisible.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
  const stalledTasks = allVisible.filter((t) => t.status === 'Stalled').length;
  const pendingSignOff = allVisible.filter((t) => (t.status === 'Delivered' || t.status === 'Finished') && !t.acknowledgedAt).length;
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const clientTasksOpen = allVisible.filter((t) => (t.owner === 'Client' || t.owner === 'Both') && t.status !== 'Delivered' && t.status !== 'Finished').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: isManager ? '#3b82f6' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          {isManager ? 'Architect View' : 'Client Portal'}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Project Dashboard</h1>
        <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px', margin: '6px 0 0' }}>
          {isManager ? 'All projects — progress, health, and client signals.' : 'Update status, sign off deliverables, and leave comments.'}
        </p>
      </div>

      {/* Summary stat tiles */}
      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Projects', value: projects.length, accent: '#3b82f6', sub: 'Total tracked' },
            { label: 'Completion', value: `${overallPct}%`, accent: overallPct >= 70 ? '#10b981' : '#6366f1', sub: `${completedTasks}/${totalTasks} tasks` },
            { label: isManager ? 'Waiting on Client' : 'Your Tasks', value: clientTasksOpen, accent: clientTasksOpen > 0 ? '#f59e0b' : '#6366f1', sub: 'Open items' },
            { label: 'Stalled', value: stalledTasks, accent: stalledTasks > 0 ? '#ef4444' : '#6366f1', sub: 'Need attention' },
            { label: 'Pending Sign-off', value: pendingSignOff, accent: pendingSignOff > 0 ? '#10b981' : '#6366f1', sub: 'Awaiting acknowledgment' },
          ].map(({ label, value, accent, sub }) => (
            <Surface key={label} elevation="flat" style={{ padding: '18px', borderTop: `3px solid ${accent}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{label}</div>
              <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1, marginBottom: '6px', color: Number(value) > 0 && label !== 'Projects' && label !== 'Completion' ? accent : 'var(--dt-colors-text-primary)' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>{sub}</div>
            </Surface>
          ))}
        </div>
      )}

      {/* Controls */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)', fontWeight: 600 }}>Sort:</span>
            {([['progress', 'Progress'], ['client', 'Client'], ['name', 'Name'], ['expected', 'Due Date']] as [string, string][]).map(([val, label]) => (
              <Button key={val} variant={sortBy === val ? 'emphasized' : 'default'} onClick={() => setSortBy(val as typeof sortBy)}>{label}</Button>
            ))}
          </div>
          {uniqueClients.length > 1 && (
            <select
              value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '13px', marginLeft: 'auto' }}
            >
              <option value="">All clients</option>
              {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Project cards */}
      {projects.length === 0 ? (
        <EmptyState>
          <EmptyState.Title>No projects available</EmptyState.Title>
          <EmptyState.Details>{isManager ? 'Create projects in Project Management.' : 'No projects have been imported yet.'}</EmptyState.Details>
        </EmptyState>
      ) : sorted.length === 0 ? (
        <EmptyState><EmptyState.Title>No projects match the filter</EmptyState.Title></EmptyState>
      ) : (
        sorted.map((project) => (
          <ProjectCard
            key={project.id} project={project} isManager={isManager} lastVisit={lastVisit}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onAcknowledge={handleAcknowledge}
          />
        ))
      )}
    </div>
  );
};
