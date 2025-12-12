import React from 'react';
import { Task, TaskStatus } from '../../pages/Engagements';

interface TasksByStatusProps {
  tasks: Task[];
  viewMode: 'list' | 'kanban';
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

const statusOrder: TaskStatus[] = ['Not Started', 'In Progress', 'Stalled', 'Finished', 'Delivered'];

const statusColors: Record<TaskStatus, string> = {
  'Not Started': '#757575',
  'In Progress': '#2196f3',
  'Stalled': '#ff9800',
  'Finished': '#4caf50',
  'Delivered': '#9c27b0',
};

interface TaskCardProps {
  task: Task;
  showStatus?: boolean;
  onUpdateStatus: (newStatus: TaskStatus) => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showStatus = true, onUpdateStatus, onDelete }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Delivered';

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'var(--dt-colors-surface-container-subtle)',
        border: `1px solid var(--dt-colors-border-container-default)`,
        borderLeft: `4px solid ${statusColors[task.status]}`,
        borderRadius: '6px',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--dt-colors-surface-container-default)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--dt-colors-surface-container-subtle)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
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
            {task.title}
          </div>
          {task.description && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--dt-colors-text-secondary)',
                marginBottom: '8px',
              }}
            >
              {task.description}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          style={{
            marginLeft: '8px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
        <div style={{ color: isOverdue ? '#f44336' : 'var(--dt-colors-text-secondary)' }}>
          📅 {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && ' (Overdue)'}
        </div>
        {showStatus && (
          <select
            value={task.status}
            onChange={(e) => onUpdateStatus(e.target.value as TaskStatus)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--dt-colors-surface-default)',
              border: `1px solid ${statusColors[task.status]}`,
              borderRadius: '4px',
              color: statusColors[task.status],
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export const TasksByStatus: React.FC<TasksByStatusProps> = ({
  tasks,
  viewMode,
  onUpdateStatus,
  onDeleteTask,
}) => {
  if (viewMode === 'list') {
    const tasksByStatus = statusOrder.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {tasksByStatus.map(({ status, tasks: statusTasks }) => (
          <div key={status}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '20px',
                  backgroundColor: statusColors[status],
                  borderRadius: '2px',
                }}
              />
              {status} ({statusTasks.length})
            </div>
            {statusTasks.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--dt-colors-text-secondary)',
                  backgroundColor: 'var(--dt-colors-surface-container-subtle)',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                No tasks in this status
              </div>
            ) : (
              statusTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showStatus={true}
                  onUpdateStatus={(newStatus) => onUpdateStatus(task.id, newStatus)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))
            )}
          </div>
        ))}
      </div>
    );
  }

  // Kanban view
  const tasksByStatus = statusOrder.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        height: 'calc(100vh - 300px)',
        overflow: 'hidden',
      }}
    >
      {tasksByStatus.map(({ status, tasks: statusTasks }) => (
        <div
          key={status}
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--dt-colors-surface-default)',
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid var(--dt-colors-border-container-default)`,
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--dt-colors-surface-default)',
              paddingBottom: '8px',
              borderBottom: `2px solid ${statusColors[status]}`,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: statusColors[status],
                borderRadius: '50%',
              }}
            />
            <div style={{ flex: 1 }}>{status}</div>
            <div
              style={{
                backgroundColor: statusColors[status],
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {statusTasks.length}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {statusTasks.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--dt-colors-text-secondary)',
                  fontSize: '12px',
                }}
              >
                No tasks
              </div>
            ) : (
              statusTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showStatus={false}
                  onUpdateStatus={(newStatus) => onUpdateStatus(task.id, newStatus)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
