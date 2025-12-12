import React, { useState, useEffect } from 'react';
import { Heading } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components';
import { CreateEngagementModal } from '../components/Engagements/CreateEngagementModal';
import { CreateTaskModal } from '../components/Engagements/CreateTaskModal';
import { EngagementCard } from '../components/Engagements/EngagementCard';
import { TasksByStatus } from '../components/Engagements/TasksByStatus';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Stalled' | 'Finished' | 'Delivered';

export interface Task {
  id: string;
  engagementId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
}

export interface Engagement {
  id: string;
  name: string;
  clientName: string;
  description: string;
  createdAt: string;
  tasks: Task[];
}

export const Engagements = () => {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showCreateEngagement, setShowCreateEngagement] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load engagements from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('esa-engagements');
    if (stored) {
      const parsed = JSON.parse(stored);
      setEngagements(parsed);
      if (parsed.length > 0 && !selectedEngagement) {
        setSelectedEngagement(parsed[0]);
      }
    }
  }, []);

  // Save engagements to localStorage whenever they change
  useEffect(() => {
    if (engagements.length > 0) {
      localStorage.setItem('esa-engagements', JSON.stringify(engagements));
    }
  }, [engagements]);

  const handleExportEngagements = () => {
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
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        if (!Array.isArray(raw)) throw new Error('Invalid JSON: expected an array');
        const normalized = raw.map((eng: any) => ({
          id: String(eng.id ?? `eng-${Date.now()}`),
          name: String(eng.name ?? eng.title ?? 'Untitled Engagement'),
          clientName: String(eng.clientName ?? eng.client ?? 'Unknown Client'),
          description: String(eng.description ?? eng.notes ?? ''),
          createdAt: String(eng.createdAt ?? new Date().toISOString()),
          tasks: Array.isArray(eng.tasks) ? eng.tasks.map((t: any) => ({
            id: String(t.id ?? `task-${Date.now()}`),
            engagementId: String(eng.id ?? `eng-${Date.now()}`),
            title: String(t.title ?? 'Task'),
            description: String(t.description ?? t.notes ?? ''),
            dueDate: String(t.dueDate ?? ''),
            status: (t.status ?? 'Not Started') as TaskStatus,
            createdAt: String(t.createdAt ?? new Date().toISOString()),
          })) : [],
        }));
        // Require clientName for all engagements
        const invalid = normalized.find((e) => !e.clientName || e.clientName.trim().length === 0);
        if (invalid) throw new Error('Invalid engagement schema: each engagement must include a clientName');
        setEngagements(normalized);
        localStorage.setItem('esa-engagements', JSON.stringify(normalized));
        setSelectedEngagement(normalized[0] || null);
        setImportMessage(`Imported ${normalized.length} engagement(s) successfully.`);

        // Ensure clients exist for imported engagements
        const storedClients = localStorage.getItem('esa-clients');
        const clients: Record<string, any> = storedClients ? JSON.parse(storedClients) : {};
        let changed = false;
        normalized.forEach((eng) => {
          if (!clients[eng.clientName]) {
            clients[eng.clientName] = {
              id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
              name: eng.clientName,
              primaryContact: '',
              notes: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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

  const handleCreateEngagement = (name: string, description: string, clientName: string) => {
    const newEngagement: Engagement = {
      id: `eng-${Date.now()}`,
      name,
      clientName,
      description,
      createdAt: new Date().toISOString(),
      tasks: [],
    };
    setEngagements([...engagements, newEngagement]);
    setSelectedEngagement(newEngagement);
    setShowCreateEngagement(false);

    // Ensure client exists in registry
    const storedClients = localStorage.getItem('esa-clients');
    const clients: Record<string, any> = storedClients ? JSON.parse(storedClients) : {};
    if (!clients[clientName]) {
      clients[clientName] = {
        id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
        name: clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('esa-clients', JSON.stringify(clients));
    }
  };

  const handleCreateTask = (title: string, description: string, dueDate: string) => {
    if (!selectedEngagement) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      engagementId: selectedEngagement.id,
      title,
      description,
      dueDate,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
    };

    const updatedEngagements = engagements.map((eng) =>
      eng.id === selectedEngagement.id
        ? { ...eng, tasks: [...eng.tasks, newTask] }
        : eng
    );

    setEngagements(updatedEngagements);
    setSelectedEngagement({
      ...selectedEngagement,
      tasks: [...selectedEngagement.tasks, newTask],
    });
    setShowCreateTask(false);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!selectedEngagement) return;

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

    setEngagements(updatedEngagements);
    const updated = updatedEngagements.find((e) => e.id === selectedEngagement.id);
    if (updated) {
      setSelectedEngagement(updated);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedEngagement) return;

    const updatedEngagements = engagements.map((eng) =>
      eng.id === selectedEngagement.id
        ? { ...eng, tasks: eng.tasks.filter((task) => task.id !== taskId) }
        : eng
    );

    setEngagements(updatedEngagements);
    const updated = updatedEngagements.find((e) => e.id === selectedEngagement.id);
    if (updated) {
      setSelectedEngagement(updated);
    }
  };

  const handleDeleteEngagement = (engagementId: string) => {
    const updated = engagements.filter((e) => e.id !== engagementId);
    setEngagements(updated);
    if (selectedEngagement?.id === engagementId) {
      setSelectedEngagement(updated.length > 0 ? updated[0] : null);
    }
    if (updated.length === 0) {
      localStorage.removeItem('esa-engagements');
    }
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
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: 'var(--dt-colors-surface-selected)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              {importMessage}
            </div>
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
          <button
            onClick={handleExportEngagements}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Download engagements JSON"
          >
            ⬇️ Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Upload engagements JSON"
          >
            ⬆️ Import JSON
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {viewMode === 'list' ? '📊 Kanban View' : '📋 List View'}
          </button>
          <Button variant="accent" onClick={() => setShowCreateEngagement(true)}>
            + New Engagement
          </Button>
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
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--dt-colors-text-secondary)',
                  fontSize: '14px',
                }}
              >
                No engagements yet.
                <br />
                Create your first one!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {engagements.map((engagement) => (
                  <EngagementCard
                    key={engagement.id}
                    engagement={engagement}
                    isSelected={selectedEngagement?.id === engagement.id}
                    onSelect={() => setSelectedEngagement(engagement)}
                    onDelete={() => handleDeleteEngagement(engagement.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Area */}
        <div style={{ flex: 1 }}>
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
                  <Button variant="accent" onClick={() => setShowCreateTask(true)}>
                    + Add Task
                  </Button>
                </div>
              </div>

              {/* Tasks Visualization */}
              <TasksByStatus
                tasks={selectedEngagement.tasks}
                viewMode={viewMode}
                onUpdateStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            </>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--dt-colors-surface-container-default)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '8px',
                padding: '64px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <Heading level={3} style={{ marginBottom: '8px' }}>
                No Engagement Selected
              </Heading>
              <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px' }}>
                Select an engagement from the sidebar or create a new one to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateEngagement && (
        <CreateEngagementModal
          onClose={() => setShowCreateEngagement(false)}
          onCreate={handleCreateEngagement}
        />
      )}

      {showCreateTask && selectedEngagement && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
};
