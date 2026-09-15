import React, { useState, useEffect } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Heading } from '@dynatrace/strato-components/typography';
import { EmptyState, MessageContainer } from '@dynatrace/strato-components-preview/content';
import { CreateEngagementModal } from '../components/Engagements/CreateEngagementModal';
import { CreateTaskModal } from '../components/Engagements/CreateTaskModal';
import { EngagementCard } from '../components/Engagements/EngagementCard';
import { ObjectiveModal } from '../components/Engagements/ObjectiveModal';
import { TasksByStatus } from '../components/Engagements/TasksByStatus';
import {
  canUpdateEngagementTaskStatus,
  isEngagementMutableByUser,
  isEngagementVisibleToUser,
  mergeVisibleEngagements,
} from '../utils/partitionedCollection';
import { getClientRegistryKey, parseClientRegistry } from '../utils/clientRegistry';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Stalled' | 'Finished' | 'Delivered';

export interface Objective {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  engagementId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  objectiveId?: string;
}

export interface Engagement {
  id: string;
  name: string;
  clientName: string;
  description: string;
  createdAt: string;
  tasks: Task[];
  objectives?: Objective[];
  appId?: string;
  assignedClientAppIds?: string[];
}

const getConfiguredAppIds = () => {
  try {
    const users: unknown = JSON.parse(localStorage.getItem('esa-users') || '[]');
    return Array.isArray(users)
      ? users.flatMap((user) => typeof user === 'object' && user !== null && 'appId' in user && typeof user.appId === 'string' ? [user.appId] : [])
      : [];
  } catch {
    return [];
  }
};

export const Engagements = ({ userAppId, isManager }: { userAppId: string | null; isManager: boolean }) => {
  const [allEngagements, setAllEngagements] = useState<Engagement[]>([]);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showCreateEngagement, setShowCreateEngagement] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(null);
  const [editingObjective, setEditingObjective] = useState<Objective | null | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('esa-engagements');
    try {
      const parsed = stored ? JSON.parse(stored) : [];
      const fullCollection = Array.isArray(parsed) ? parsed : [];
      setAllEngagements(fullCollection);
      const visible = fullCollection.filter((engagement: Engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager));
      setSelectedEngagement(visible[0] ?? null);
    } catch (error) {
      console.error('Failed to parse engagements:', error);
      setAllEngagements([]);
      setSelectedEngagement(null);
    }
  }, [userAppId, isManager]);

  const engagements = allEngagements.filter((engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager));

  const persistEngagements = (nextVisibleEngagements: Engagement[]) => {
    const merged = mergeVisibleEngagements(allEngagements, nextVisibleEngagements, userAppId, isManager);
    setAllEngagements(merged);
    localStorage.setItem('esa-engagements', JSON.stringify(merged));
    return merged;
  };

  const handleExportEngagements = () => {
    if (!isManager) {
      setImportMessage('Only administrators can export engagements.');
      return;
    }
    const data = JSON.stringify(engagements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esa-engagements.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportEngagements = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManager) {
      setImportMessage('Only administrators can import engagements.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        if (!Array.isArray(raw)) throw new Error('Invalid JSON: expected an array');
        const normalized: Engagement[] = raw.map((eng: any, engagementIndex: number) => {
          const id = String(eng.id ?? `eng-${Date.now()}-${engagementIndex}`);
          return {
            id,
            name: String(eng.name ?? eng.title ?? 'Untitled Engagement'),
            clientName: String(eng.clientName ?? eng.client ?? 'Unknown Client'),
            description: String(eng.description ?? eng.notes ?? ''),
            createdAt: String(eng.createdAt ?? new Date().toISOString()),
            assignedClientAppIds: Array.isArray(eng.assignedClientAppIds)
              ? eng.assignedClientAppIds.filter((appId: unknown): appId is string => typeof appId === 'string')
              : undefined,
            objectives: Array.isArray(eng.objectives) ? eng.objectives.map((objective: any, index: number) => ({
              id: String(objective.id ?? `obj-${Date.now()}-${index}`),
              title: String(objective.title ?? 'Untitled Objective'),
              description: String(objective.description ?? ''),
              createdAt: String(objective.createdAt ?? new Date().toISOString()),
            })) : undefined,
            tasks: Array.isArray(eng.tasks) ? eng.tasks.map((task: any, taskIndex: number) => ({
              id: String(task.id ?? `task-${Date.now()}-${taskIndex}`),
              engagementId: id,
              title: String(task.title ?? 'Task'),
              description: String(task.description ?? task.notes ?? ''),
              dueDate: String(task.dueDate ?? ''),
              status: (task.status ?? 'Not Started') as TaskStatus,
              createdAt: String(task.createdAt ?? new Date().toISOString()),
              objectiveId: typeof task.objectiveId === 'string' ? task.objectiveId : undefined,
            })) : [],
          };
        });
        // Require clientName for all engagements
        const invalid = normalized.find((e) => !e.clientName || e.clientName.trim().length === 0);
        if (invalid) throw new Error('Invalid engagement schema: each engagement must include a clientName');
        
        // Merge with existing engagements from localStorage instead of replacing
        const existingIds = new Set(
          engagements.map((engagement) => engagement.id),
        );
        
        // Only add engagements that don't already exist (by ID)
        const newEngagements = normalized.filter(e => !existingIds.has(e.id));
        const mergedEngagements = persistEngagements([...engagements, ...newEngagements]);
        setSelectedEngagement(newEngagements[0] ?? mergedEngagements.find((engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager)) ?? null);
        setImportMessage(`Imported ${newEngagements.length} new engagement(s) successfully. (${normalized.length - newEngagements.length} duplicates skipped)`);

        // Ensure clients exist for imported engagements
        const clients = parseClientRegistry(localStorage.getItem('esa-clients'));
        let changed = false;
        newEngagements.forEach((eng) => {
          const clientAppId = isManager ? undefined : userAppId || undefined;
          const clientKey = getClientRegistryKey(eng.clientName, clientAppId);
          if (!clients[clientKey]) {
            clients[clientKey] = {
              id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
              name: eng.clientName,
              primaryContact: '',
              notes: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              appId: clientAppId,
            };
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('esa-clients', JSON.stringify(clients));
        }
      } catch (err) {
        alert('Failed to import engagements JSON. Please check the file format.');
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveEngagement = (name: string, description: string, clientName: string, assignedClientAppIds: string[]) => {
    if (!isManager) return;
    if (editingEngagement) {
      const updatedEngagement = { ...editingEngagement, name, description, clientName, assignedClientAppIds };
      persistEngagements(engagements.map((engagement) => engagement.id === updatedEngagement.id ? updatedEngagement : engagement));
      setSelectedEngagement(updatedEngagement);
      setEditingEngagement(null);
      return;
    }
    const newEngagement: Engagement = {
      id: `eng-${Date.now()}`,
      name,
      clientName,
      description,
      createdAt: new Date().toISOString(),
      tasks: [],
      assignedClientAppIds,
    };
    persistEngagements([...engagements, newEngagement]);
    setSelectedEngagement(newEngagement);
    setShowCreateEngagement(false);

    // Ensure client exists in registry
    const clients = parseClientRegistry(localStorage.getItem('esa-clients'));
    const clientAppId = undefined;
    const clientKey = getClientRegistryKey(clientName, clientAppId);
    if (!clients[clientKey]) {
      clients[clientKey] = {
        id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
        name: clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appId: clientAppId,
      };
      localStorage.setItem('esa-clients', JSON.stringify(clients));
    }
  };

  const handleCreateTask = (title: string, description: string, dueDate: string, objectiveId?: string) => {
    if (!selectedEngagement || !isEngagementMutableByUser(selectedEngagement, userAppId, isManager)) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      engagementId: selectedEngagement.id,
      title,
      description,
      dueDate,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      objectiveId,
    };

    const updatedEngagements = engagements.map((eng) =>
      eng.id === selectedEngagement.id
        ? { ...eng, tasks: [...eng.tasks, newTask] }
        : eng
    );

    persistEngagements(updatedEngagements);
    setSelectedEngagement({
      ...selectedEngagement,
      tasks: [...selectedEngagement.tasks, newTask],
    });
    setShowCreateTask(false);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!selectedEngagement || !canUpdateEngagementTaskStatus(selectedEngagement, userAppId, isManager)) return;

    const updatedEngagements = engagements.map((eng) =>
      eng.id === selectedEngagement.id
        ? {
            ...eng,
            tasks: eng.tasks.map((task) =>
              task.id === taskId ? { ...task, status: newStatus } : task
            ),
          }
        : eng
    );

    persistEngagements(updatedEngagements);
    const updated = updatedEngagements.find((e) => e.id === selectedEngagement.id);
    if (updated) {
      setSelectedEngagement(updated);
    }
  };

  const handleSaveTask = (title: string, description: string, dueDate: string, objectiveId?: string) => {
    if (!isManager || !selectedEngagement || !editingTask) {
      setImportMessage('Only administrators can edit task details.');
      return;
    }
    const updatedEngagements = engagements.map((engagement) =>
      engagement.id === selectedEngagement.id
        ? {
            ...engagement,
            tasks: engagement.tasks.map((task) =>
              task.id === editingTask.id ? { ...task, title, description, dueDate, objectiveId } : task,
            ),
          }
        : engagement,
    );
    persistEngagements(updatedEngagements);
    const updated = updatedEngagements.find((engagement) => engagement.id === selectedEngagement.id);
    if (updated) setSelectedEngagement(updated);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedEngagement || !isEngagementMutableByUser(selectedEngagement, userAppId, isManager)) return;

    const updatedEngagements = engagements.map((eng) =>
      eng.id === selectedEngagement.id
        ? { ...eng, tasks: eng.tasks.filter((task) => task.id !== taskId) }
        : eng
    );

    persistEngagements(updatedEngagements);
    const updated = updatedEngagements.find((e) => e.id === selectedEngagement.id);
    if (updated) {
      setSelectedEngagement(updated);
    }
  };

  const handleDeleteEngagement = (engagementId: string) => {
    const engagement = engagements.find((item) => item.id === engagementId);
    if (!engagement || !isEngagementMutableByUser(engagement, userAppId, isManager)) return;
    const updated = engagements.filter((e) => e.id !== engagementId);
    persistEngagements(updated);
    if (selectedEngagement?.id === engagementId) {
      setSelectedEngagement(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleSaveObjective = (title: string, description: string) => {
    if (!selectedEngagement || !isEngagementMutableByUser(selectedEngagement, userAppId, isManager)) return;
    const objective = editingObjective ?? {
      id: `obj-${Date.now()}`,
      title,
      description,
      createdAt: new Date().toISOString(),
    };
    const objectives = editingObjective
      ? (selectedEngagement.objectives ?? []).map((item) => item.id === objective.id ? { ...item, title, description } : item)
      : [...(selectedEngagement.objectives ?? []), objective];
    const updated = engagements.map((engagement) => engagement.id === selectedEngagement.id ? { ...engagement, objectives } : engagement);
    persistEngagements(updated);
    setSelectedEngagement({ ...selectedEngagement, objectives });
    setEditingObjective(undefined);
  };

  const handleDeleteObjective = (objectiveId: string) => {
    if (!selectedEngagement || !isEngagementMutableByUser(selectedEngagement, userAppId, isManager)) return;
    const objectives = (selectedEngagement.objectives ?? []).filter((objective) => objective.id !== objectiveId);
    const tasks = selectedEngagement.tasks.map((task) => task.objectiveId === objectiveId ? { ...task, objectiveId: undefined } : task);
    const updated = engagements.map((engagement) => engagement.id === selectedEngagement.id ? { ...engagement, objectives, tasks } : engagement);
    persistEngagements(updated);
    setSelectedEngagement({ ...selectedEngagement, objectives, tasks });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <Heading level={1} style={{ marginBottom: '8px' }}>
            Engagement Management
          </Heading>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px' }}>
            Manage your ESA engagements and track tasks
          </p>
          {importMessage && (
            <MessageContainer style={{ marginTop: '8px' }}>{importMessage}</MessageContainer>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportEngagements}
          />
          {isManager && <Button onClick={handleExportEngagements}>Export JSON</Button>}
          {isManager && <Button onClick={() => fileInputRef.current?.click()}>Import JSON</Button>}
          <Button onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </Button>
          {isManager && <Button variant="emphasized" onClick={() => setShowCreateEngagement(true)}>
            New Engagement
          </Button>}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Engagements Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '12px',
                color: 'var(--dt-colors-text-primary)',
              }}
            >
              Engagements ({engagements.length})
            </div>
            {engagements.length === 0 ? (
              <EmptyState size="small"><EmptyState.Title>No engagements yet</EmptyState.Title><EmptyState.Details>Create your first one.</EmptyState.Details></EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {engagements.map((engagement) => (
                  <EngagementCard
                    key={engagement.id}
                    engagement={engagement}
                    isSelected={selectedEngagement?.id === engagement.id}
                    onSelect={() => setSelectedEngagement(engagement)}
                    onDelete={() => handleDeleteEngagement(engagement.id)}
                    canDelete={isEngagementMutableByUser(engagement, userAppId, isManager)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedEngagement ? (
            <>
              {/* Engagement Info */}
              <div
                style={{
                  backgroundColor: 'var(--dt-colors-surface-container-default)',
                  border: '1px solid var(--dt-colors-border-container-default)',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <Heading level={2} style={{ marginBottom: '8px' }}>
                      {selectedEngagement.name}
                    </Heading>
                    <p
                      style={{
                        color: 'var(--dt-colors-text-secondary)',
                        fontSize: '14px',
                        marginBottom: '12px',
                      }}
                    >
                      {selectedEngagement.description}
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                      Client: <strong>{selectedEngagement.clientName}</strong> • Created: {new Date(selectedEngagement.createdAt).toLocaleDateString()} • {selectedEngagement.tasks.length} tasks
                    </div>
                  </div>
                  {isManager && <Button onClick={() => setEditingEngagement(selectedEngagement)}>Edit Engagement</Button>}
                  <Button variant="accent" disabled={!isManager} onClick={() => setShowCreateTask(true)}>
                    + Add Task
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Heading level={3}>Objectives</Heading>
                  <Button disabled={!isManager} onClick={() => setEditingObjective(null)}>New Objective</Button>
                </div>
                {(selectedEngagement.objectives ?? []).length === 0 ? (
                  <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px' }}>No objectives defined. Unassigned tasks remain visible below.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {(selectedEngagement.objectives ?? []).map((objective) => {
                      const assignedTasks = selectedEngagement.tasks.filter((task) => task.objectiveId === objective.id);
                      const completedTasks = assignedTasks.filter((task) => task.status === 'Delivered').length;
                      const progress = assignedTasks.length ? Math.round((completedTasks / assignedTasks.length) * 100) : 0;
                      return <div key={objective.id} style={{ border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><strong>{objective.title}</strong><div><Button size="condensed" disabled={!isManager} onClick={() => setEditingObjective(objective)}>Edit</Button><Button size="condensed" color="critical" disabled={!isManager} onClick={() => handleDeleteObjective(objective.id)}>Delete</Button></div></div>
                        {objective.description && <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px' }}>{objective.description}</p>}
                        <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px' }}>{completedTasks}/{assignedTasks.length} delivered ({progress}%)</div>
                      </div>;
                    })}
                  </div>
                )}
              </div>

              {/* Tasks Visualization */}
              <TasksByStatus
                tasks={selectedEngagement.tasks}
                viewMode={viewMode}
                objectives={selectedEngagement.objectives ?? []}
                onUpdateStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onEditTask={setEditingTask}
                canManage={isEngagementMutableByUser(selectedEngagement, userAppId, isManager)}
                canUpdateStatus={canUpdateEngagementTaskStatus(selectedEngagement, userAppId, isManager)}
              />
            </>
          ) : (
            <EmptyState>
              <EmptyState.Title>No engagement selected</EmptyState.Title>
              <EmptyState.Details>Select an engagement from the sidebar or create a new one to get started.</EmptyState.Details>
            </EmptyState>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateEngagement && (
        <CreateEngagementModal
          onClose={() => setShowCreateEngagement(false)}
          onCreate={handleSaveEngagement}
          configuredAppIds={getConfiguredAppIds()}
        />
      )}

      {editingEngagement && (
        <CreateEngagementModal
          engagement={editingEngagement}
          onClose={() => setEditingEngagement(null)}
          onCreate={handleSaveEngagement}
          configuredAppIds={getConfiguredAppIds()}
        />
      )}

      {showCreateTask && selectedEngagement && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreate={handleCreateTask}
          objectives={selectedEngagement.objectives ?? []}
        />
      )}

      {editingTask && selectedEngagement && (
        <CreateTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onCreate={handleSaveTask}
          objectives={selectedEngagement.objectives ?? []}
        />
      )}

      {editingObjective !== undefined && <ObjectiveModal objective={editingObjective ?? undefined} onClose={() => setEditingObjective(undefined)} onSave={handleSaveObjective} />}
    </div>
  );
};
