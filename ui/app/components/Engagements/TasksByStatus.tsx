import React from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Select } from '@dynatrace/strato-components-preview/forms';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { CalendarIcon, DeleteIcon, EditIcon } from '@dynatrace/strato-icons';
import { Objective, Task, TaskStatus } from '../../pages/Engagements';

interface TasksByStatusProps {
  tasks: Task[];
  viewMode: 'list' | 'kanban';
  objectives: Objective[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  canManage: boolean;
  canUpdateStatus: boolean;
}

const statusOrder: TaskStatus[] = ['Not Started', 'In Progress', 'Stalled', 'Finished', 'Delivered'];

const statusColors: Record<TaskStatus, string> = {
  'Not Started': 'var(--dt-colors-icon-secondary)',
  'In Progress': 'var(--dt-colors-icon-primary)',
  'Stalled': 'var(--dt-colors-icon-warning)',
  'Finished': 'var(--dt-colors-icon-success)',
  'Delivered': 'var(--dt-colors-icon-primary)',
};

interface TaskCardProps {
  task: Task;
  objective?: Objective;
  showStatus?: boolean;
  onUpdateStatus: (newStatus: TaskStatus) => void;
  onDelete: () => void;
  onEdit: () => void;
  canManage: boolean;
  canUpdateStatus: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, objective, showStatus = true, onUpdateStatus, onDelete, onEdit, canManage, canUpdateStatus }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Delivered';

  return (
    <Surface
      elevation="flat"
      style={{
        padding: '12px',
        borderLeft: `4px solid ${statusColors[task.status]}`,
        marginBottom: '8px',
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
          {objective && <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px' }}>Objective: {objective.title}</div>}
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <Tooltip text="Edit task">
              <Button aria-label="Edit task" size="condensed" onClick={onEdit}><EditIcon /></Button>
            </Tooltip>
            <Tooltip text="Delete task">
              <Button aria-label="Delete task" size="condensed" color="critical" onClick={onDelete}><DeleteIcon /></Button>
            </Tooltip>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
        <div style={{ color: isOverdue ? 'var(--dt-colors-text-critical)' : 'var(--dt-colors-text-secondary)' }}>
          <CalendarIcon /> {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && ' (Overdue)'}
        </div>
        {showStatus && (
          <Select aria-label="Task status" value={task.status} disabled={!canUpdateStatus} onChange={(value) => onUpdateStatus(value as TaskStatus)}>
            <Select.Content>
              {statusOrder.map((status) => <Select.Option key={status} value={status}>{status}</Select.Option>)}
            </Select.Content>
          </Select>
        )}
      </div>
    </Surface>
  );
};

export const TasksByStatus: React.FC<TasksByStatusProps> = ({
  tasks,
  viewMode,
  objectives,
  onUpdateStatus,
  onDeleteTask,
  onEditTask,
  canManage,
  canUpdateStatus,
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
                  objective={objectives.find((objective) => objective.id === task.objectiveId)}
                  showStatus={true}
                  onUpdateStatus={(newStatus) => onUpdateStatus(task.id, newStatus)}
                  onDelete={() => onDeleteTask(task.id)}
                  onEdit={() => onEditTask(task)}
                  canManage={canManage}
                  canUpdateStatus={canUpdateStatus}
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
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {tasksByStatus.map(({ status, tasks: statusTasks }) => (
        <Surface
          key={status}
          elevation="flat"
          style={{
            minWidth: '240px',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
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
              backgroundColor: 'var(--dt-colors-surface-container-default)',
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
                color: 'var(--dt-colors-text-inverted)',
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
                  objective={objectives.find((objective) => objective.id === task.objectiveId)}
                  showStatus={true}
                  onUpdateStatus={(newStatus) => onUpdateStatus(task.id, newStatus)}
                  onDelete={() => onDeleteTask(task.id)}
                  onEdit={() => onEditTask(task)}
                  canManage={canManage}
                  canUpdateStatus={canUpdateStatus}
                />
              ))
            )}
          </div>
        </Surface>
      ))}
    </div>
  );
};
