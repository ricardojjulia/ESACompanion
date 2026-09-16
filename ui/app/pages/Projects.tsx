import React, { useState, useEffect } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { EmptyState, MessageContainer } from '@dynatrace/strato-components-preview/content';

import { CircularProgress } from '../components/ui/CircularProgress';
import { relativeDate } from '../utils/dateUtils';
import { CreateProjectModal } from '../components/Projects/CreateProjectModal';
import { CreateTaskModal } from '../components/Projects/CreateTaskModal';
import { ProjectCard } from '../components/Projects/ProjectCard';
import { ObjectiveModal } from '../components/Projects/ObjectiveModal';
import { MilestonesSection } from '../components/Projects/MilestonesSection';
import { TasksByStatus } from '../components/Projects/TasksByStatus';
import type { Project, Task, Objective, TaskStatus, Comment, Milestone, TaskFormData } from '../types/project';

const STORAGE_KEY = 'esa-engagements';
const LAST_VISIT_KEY = 'esa-last-visit-architect';

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
      objectives: p.objectives ?? [],
      milestones: p.milestones ?? [],
    }));
  } catch { return []; }
};

const saveProjects = (projects: Project[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

export const Projects = ({ isManager }: { isManager: boolean }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingObjective, setEditingObjective] = useState<Objective | null | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [exportClient, setExportClient] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [lastVisit] = useState<number>(() => {
    const prev = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    return prev;
  });

  useEffect(() => {
    const all = loadProjects();
    setProjects(all);
    setSelected(all[0] ?? null);
  }, []);

  const persist = (next: Project[]) => {
    setProjects(next);
    saveProjects(next);
    return next;
  };

  const updateSelected = (next: Project[]) => {
    const updated = next.find((p) => p.id === selected?.id) ?? null;
    setSelected(updated);
    return next;
  };

  // ── Project CRUD ────────────────────────────────────────────────────────────

  const handleSaveProject = (name: string, description: string, clientName: string, expectedDate: string) => {
    if (!isManager) return;
    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id ? { ...p, name, description, clientName, expectedDate } : p
      );
      persist(updated);
      updateSelected(updated);
      setEditingProject(null);
      return;
    }
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name, clientName, description,
      createdAt: new Date().toISOString(),
      expectedDate,
      tasks: [],
      objectives: [],
      milestones: [],
    };
    const next = [...projects, newProject];
    persist(next);
    setSelected(newProject);
    setShowCreateProject(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!isManager) return;
    const next = persist(projects.filter((p) => p.id !== projectId));
    if (selected?.id === projectId) setSelected(next[0] ?? null);
  };

  // ── Milestone CRUD ──────────────────────────────────────────────────────────

  const updateMilestones = (milestones: Milestone[]) => {
    if (!selected) return;
    const next = projects.map((p) => p.id === selected.id ? { ...p, milestones } : p);
    persist(next);
    updateSelected(next);
  };

  const handleAddMilestone = (title: string, description: string, dueDate: string) => {
    const ms: Milestone = { id: `ms-${Date.now()}`, title, description, dueDate };
    updateMilestones([...(selected?.milestones ?? []), ms]);
  };

  const handleEditMilestone = (id: string, title: string, description: string, dueDate: string) => {
    updateMilestones((selected?.milestones ?? []).map((m) => m.id === id ? { ...m, title, description, dueDate } : m));
  };

  const handleDeleteMilestone = (id: string) => {
    updateMilestones((selected?.milestones ?? []).filter((m) => m.id !== id));
  };

  const handleCompleteMilestone = (id: string) => {
    updateMilestones((selected?.milestones ?? []).map((m) => m.id === id ? { ...m, completedAt: new Date().toISOString() } : m));
  };

  // ── Task CRUD ───────────────────────────────────────────────────────────────

  const handleCreateTask = (data: TaskFormData) => {
    if (!selected || !isManager) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: selected.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objectiveId: data.objectiveId,
      milestoneId: data.milestoneId,
      owner: data.owner ?? 'Architect',
      visibility: data.visibility ?? 'all',
      subtasks: data.subtasks ?? [],
      comments: [],
    };
    const next = projects.map((p) =>
      p.id === selected.id ? { ...p, tasks: [...p.tasks, newTask] } : p
    );
    persist(next);
    updateSelected(next);
    setShowCreateTask(false);
  };

  const handleSaveTask = (data: TaskFormData) => {
    if (!isManager || !selected || !editingTask) return;
    const next = projects.map((p) =>
      p.id === selected.id
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === editingTask.id
                ? { ...t, ...data, updatedAt: new Date().toISOString() }
                : t
            ),
          }
        : p
    );
    persist(next);
    updateSelected(next);
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!selected) return;
    const next = projects.map((p) =>
      p.id === selected.id
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t) }
        : p
    );
    persist(next);
    updateSelected(next);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selected || !isManager) return;
    const next = projects.map((p) =>
      p.id === selected.id ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
    );
    persist(next);
    updateSelected(next);
  };

  const handleAddComment = (taskId: string, text: string) => {
    if (!selected) return;
    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      role: isManager ? 'Architect' : 'Client',
    };
    const next = projects.map((p) =>
      p.id === selected.id
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId
                ? { ...t, comments: [...(t.comments ?? []), comment], updatedAt: new Date().toISOString() }
                : t
            ),
          }
        : p
    );
    persist(next);
    updateSelected(next);
  };

  const handleDeleteComment = (taskId: string, commentId: string) => {
    if (!selected) return;
    const next = projects.map((p) =>
      p.id === selected.id
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId) } : t) }
        : p
    );
    persist(next);
    updateSelected(next);
  };

  const handleAcknowledge = (taskId: string) => {
    if (!selected) return;
    const next = projects.map((p) =>
      p.id === selected.id
        ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, acknowledgedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : t) }
        : p
    );
    persist(next);
    updateSelected(next);
  };

  // ── Objective CRUD ──────────────────────────────────────────────────────────

  const handleSaveObjective = (title: string, description: string) => {
    if (!selected || !isManager) return;
    const obj = editingObjective ?? { id: `obj-${Date.now()}`, title, description, createdAt: new Date().toISOString() };
    const objectives = editingObjective
      ? (selected.objectives ?? []).map((o) => o.id === obj.id ? { ...o, title, description } : o)
      : [...(selected.objectives ?? []), { ...obj, title, description }];
    const next = projects.map((p) => p.id === selected.id ? { ...p, objectives } : p);
    persist(next);
    updateSelected(next);
    setEditingObjective(undefined);
  };

  const handleDeleteObjective = (objectiveId: string) => {
    if (!selected || !isManager) return;
    const objectives = (selected.objectives ?? []).filter((o) => o.id !== objectiveId);
    const tasks = selected.tasks.map((t) => t.objectiveId === objectiveId ? { ...t, objectiveId: undefined } : t);
    const next = projects.map((p) => p.id === selected.id ? { ...p, objectives, tasks } : p);
    persist(next);
    updateSelected(next);
  };

  // ── Import / Export ─────────────────────────────────────────────────────────

  const handleExport = (clientName?: string) => {
    const toExport = clientName ? projects.filter((p) => p.clientName === clientName) : projects;
    // Strip architect-only tasks from client exports
    const sanitized = toExport.map((p) => ({
      ...p,
      tasks: p.tasks.filter((t) => !clientName || t.visibility !== 'architect-only'),
    }));
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = clientName ? `projects-${clientName.replace(/\s+/g, '-').toLowerCase()}.json` : 'all-projects.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        if (!Array.isArray(raw)) throw new Error('Expected an array');
        const normalized: Project[] = raw.map((p: any, i: number) => {
          const id = String(p.id ?? `proj-${Date.now()}-${i}`);
          return {
            id,
            name: String(p.name ?? p.title ?? 'Untitled Project'),
            clientName: String(p.clientName ?? 'Unknown Client'),
            description: String(p.description ?? ''),
            createdAt: String(p.createdAt ?? new Date().toISOString()),
            expectedDate: p.expectedDate ? String(p.expectedDate) : undefined,
            objectives: Array.isArray(p.objectives) ? p.objectives : [],
            milestones: Array.isArray(p.milestones) ? p.milestones : [],
            tasks: Array.isArray(p.tasks) ? p.tasks.map((t: any, ti: number) => ({
              id: String(t.id ?? `task-${Date.now()}-${ti}`),
              projectId: id,
              title: String(t.title ?? 'Task'),
              description: String(t.description ?? ''),
              dueDate: String(t.dueDate ?? ''),
              status: (t.status ?? 'Not Started') as TaskStatus,
              createdAt: String(t.createdAt ?? new Date().toISOString()),
              updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
              objectiveId: t.objectiveId ?? undefined,
              milestoneId: t.milestoneId ?? undefined,
              owner: t.owner ?? 'Architect',
              visibility: t.visibility ?? 'all',
              subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
              comments: Array.isArray(t.comments) ? t.comments : (Array.isArray(t.notes) ? t.notes.map((n: any) => ({ ...n, role: 'Architect' })) : []),
            })) : [],
          };
        });
        const existingIds = new Set(projects.map((p) => p.id));
        const newProjects = normalized.filter((p) => !existingIds.has(p.id));
        const merged = persist([...projects, ...newProjects]);
        setSelected(newProjects[0] ?? merged[0] ?? null);
        setImportMessage(`Imported ${newProjects.length} project(s). ${normalized.length - newProjects.length} duplicate(s) skipped.`);
      } catch (err) {
        alert('Failed to import JSON. Please check the file format.');
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const uniqueClients = [...new Set(projects.map((p) => p.clientName))].sort();

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Architect Workspace</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Project Management</h1>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px', margin: '6px 0 0' }}>Create and manage projects, milestones, tasks, and deliverables</p>
          {importMessage && <MessageContainer style={{ marginTop: '8px' }}>{importMessage}</MessageContainer>}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
          {isManager && (
            <>
              <Button onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select
                  value={exportClient}
                  onChange={(e) => setExportClient(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '13px' }}
                >
                  <option value="">All clients</option>
                  {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button onClick={() => handleExport(exportClient || undefined)}>Export JSON</Button>
              </div>
              <Button onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
                {viewMode === 'list' ? 'Kanban View' : 'List View'}
              </Button>
              <Button variant="emphasized" onClick={() => setShowCreateProject(true)}>+ New Project</Button>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'var(--dt-colors-surface-container-default)', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Projects ({projects.length})</div>
            {projects.length === 0 ? (
              <EmptyState size="small">
                <EmptyState.Title>No projects yet</EmptyState.Title>
                <EmptyState.Details>{isManager ? 'Create your first project.' : 'No projects imported.'}</EmptyState.Details>
              </EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isSelected={selected?.id === p.id}
                    onSelect={() => setSelected(p)}
                    onDelete={() => handleDeleteProject(p.id)}
                    canDelete={isManager}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              {/* Project detail header */}
              {(() => {
                const total = selected.tasks.length;
                const done = selected.tasks.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const stalled = selected.tasks.filter((t) => t.status === 'Stalled').length;
                const ringColor = stalled > 0 ? '#f59e0b' : pct >= 80 ? '#10b981' : '#6366f1';
                const expDate = relativeDate(selected.expectedDate, pct === 100);
                return (
                  <div style={{ backgroundColor: 'var(--dt-colors-surface-container-default)', border: '1px solid var(--dt-colors-border-container-default)', borderLeft: `4px solid ${ringColor}`, borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <CircularProgress pct={pct} size={70} strokeWidth={5} color={ringColor} trackColor="var(--dt-colors-surface-container-subtle)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{selected.name}</div>
                            {selected.description && <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px', margin: '0 0 8px' }}>{selected.description}</p>}
                            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>Client: <strong>{selected.clientName}</strong></span>
                              {selected.expectedDate && <span style={{ color: expDate.color, fontWeight: expDate.isOverdue ? 600 : 400 }}>{expDate.text}</span>}
                              <span>{done}/{total} tasks done</span>
                              {(selected.milestones ?? []).length > 0 && <span>🏁 {(selected.milestones ?? []).length} milestones</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            {isManager && <Button onClick={() => setEditingProject(selected)}>Edit</Button>}
                            {isManager && <Button variant="accent" onClick={() => setShowCreateTask(true)}>+ Add Task</Button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Milestones */}
              <MilestonesSection
                milestones={selected.milestones ?? []}
                tasks={selected.tasks}
                isManager={isManager}
                onAdd={handleAddMilestone}
                onEdit={handleEditMilestone}
                onDelete={handleDeleteMilestone}
                onComplete={handleCompleteMilestone}
              />

              {/* Objectives (architect only) */}
              {isManager && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '3px', height: '16px', backgroundColor: '#6366f1', borderRadius: '2px' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Objectives</span>
                    </div>
                    <Button onClick={() => setEditingObjective(null)}>New Objective</Button>
                  </div>
                  {(selected.objectives ?? []).length === 0 ? (
                    <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px' }}>No objectives defined.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {(selected.objectives ?? []).map((obj) => {
                        const assigned = selected.tasks.filter((t) => t.objectiveId === obj.id);
                        const done = assigned.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
                        const pct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;
                        return (
                          <div key={obj.id} style={{ border: '1px solid var(--dt-colors-border-container-default)', borderLeft: '3px solid #6366f1', borderRadius: '8px', padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '13px' }}>{obj.title}</strong>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <Button size="condensed" onClick={() => setEditingObjective(obj)}>Edit</Button>
                                <Button size="condensed" color="critical" onClick={() => handleDeleteObjective(obj.id)}>Del</Button>
                              </div>
                            </div>
                            {obj.description && <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', marginBottom: '8px' }}>{obj.description}</p>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--dt-colors-text-secondary)', marginBottom: '5px' }}>
                              <span>{done}/{assigned.length} delivered</span>
                              <span style={{ color: pct === 100 ? '#10b981' : 'var(--dt-colors-text-secondary)', fontWeight: pct === 100 ? 700 : 400 }}>{pct}%</span>
                            </div>
                            <div style={{ height: '4px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#10b981' : '#6366f1', borderRadius: '2px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tasks */}
              <TasksByStatus
                tasks={selected.tasks}
                viewMode={viewMode}
                objectives={selected.objectives ?? []}
                milestones={selected.milestones ?? []}
                lastVisit={lastVisit}
                onUpdateStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onEditTask={setEditingTask}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onAcknowledge={handleAcknowledge}
                canManage={isManager}
                canUpdateStatus={true}
                isManager={isManager}
              />
            </>
          ) : (
            <EmptyState>
              <EmptyState.Title>No project selected</EmptyState.Title>
              <EmptyState.Details>{isManager ? 'Select or create a project.' : 'No projects available.'}</EmptyState.Details>
            </EmptyState>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} onSave={handleSaveProject} />}
      {editingProject && <CreateProjectModal project={editingProject} onClose={() => setEditingProject(null)} onSave={handleSaveProject} />}
      {showCreateTask && selected && (
        <CreateTaskModal onClose={() => setShowCreateTask(false)} onSave={handleCreateTask} objectives={selected.objectives ?? []} milestones={selected.milestones ?? []} />
      )}
      {editingTask && selected && (
        <CreateTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveTask} objectives={selected.objectives ?? []} milestones={selected.milestones ?? []} />
      )}
      {editingObjective !== undefined && (
        <ObjectiveModal objective={editingObjective ?? undefined} onClose={() => setEditingObjective(undefined)} onSave={handleSaveObjective} />
      )}
    </div>
  );
};
