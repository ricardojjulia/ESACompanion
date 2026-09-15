import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, Select, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Objective } from '../../pages/Engagements';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, dueDate: string, objectiveId?: string) => void;
  objectives: Objective[];
  task?: { title: string; description: string; dueDate: string; objectiveId?: string };
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onCreate, objectives, task }) => {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && dueDate) {
      onCreate(title, description, dueDate, objectiveId || undefined);
    }
  };

  return (
    <Modal show title={task ? 'Edit Task' : 'Create New Task'} onDismiss={onClose} footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="create-task" variant="emphasized" disabled={!title.trim() || !dueDate}>
          {task ? 'Save Task' : 'Create Task'}
        </Button>
      </div>
    }>
      <form id="create-task" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Task Title</Label>
          <TextInput value={title} onChange={setTitle} placeholder="Enter task title" required />
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Enter task description" rows={3} resize="vertical" />
        </FormField>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Due Date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        </label>
        <FormField>
          <Label>Objective</Label>
          <Select value={objectiveId} onChange={(value) => setObjectiveId(value as string)}>
            <Select.Content>
              <Select.Option value="">Unassigned</Select.Option>
              {objectives.map((objective) => <Select.Option key={objective.id} value={objective.id}>{objective.title}</Select.Option>)}
            </Select.Content>
          </Select>
        </FormField>
      </form>
    </Modal>
  );
};
