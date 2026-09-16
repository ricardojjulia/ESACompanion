import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, Select, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Milestone, Objective, Subtask, Task, TaskFormData, TaskOwner, TaskStatus, TaskVisibility } from '../../types/project';

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  objectives: Objective[];
  milestones: Milestone[];
  task?: Task;
}

const STATUS_OPTIONS: TaskStatus[] = ['Not Started', 'In Progress', 'Stalled', 'Finished', 'Delivered'];
const OWNER_OPTIONS: TaskOwner[] = ['Architect', 'Client', 'Both'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onSave, objectives, milestones, task }) => {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [objectiveId, setObjectiveId] = useState(task?.objectiveId ?? '');
  const [milestoneId, setMilestoneId] = useState(task?.milestoneId ?? '');
  const [owner, setOwner] = useState<TaskOwner>(task?.owner ?? 'Architect');
  const [visibility, setVisibility] = useState<TaskVisibility>(task?.visibility ?? 'all');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && dueDate) {
      onSave({
        title: title.trim(),
        description,
        dueDate,
        objectiveId: objectiveId || undefined,
        milestoneId: milestoneId || undefined,
        owner,
        visibility,
        subtasks,
      });
    }
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), status: 'Not Started' }]);
    setNewSubtaskTitle('');
  };

  const updateSubtask = (id: string, field: keyof Subtask, value: string) =>
    setSubtasks(subtasks.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const removeSubtask = (id: string) => setSubtasks(subtasks.filter((s) => s.id !== id));

  return (
    <Modal
      show
      title={task ? 'Edit Task' : 'Create New Task'}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-task" variant="emphasized" disabled={!title.trim() || !dueDate}>
            {task ? 'Save Task' : 'Create Task'}
          </Button>
        </div>
      }
    >
      <form id="create-task" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Task Title</Label>
          <TextInput value={title} onChange={setTitle} placeholder="Enter task title" required />
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Task details…" rows={3} resize="vertical" />
        </FormField>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
          <span style={{ fontWeight: 500 }}>Due Date <span style={{ color: 'var(--dt-colors-text-critical)' }}>*</span></span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            style={{ padding: '8px 12px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '14px' }}
          />
        </label>

        {/* Owner + Visibility row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField>
            <Label>Owner</Label>
            <Select value={owner} onChange={(v) => setOwner(v as TaskOwner)}>
              <Select.Content>
                {OWNER_OPTIONS.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
              </Select.Content>
            </Select>
          </FormField>
          <FormField>
            <Label>Visibility</Label>
            <Select value={visibility} onChange={(v) => setVisibility(v as TaskVisibility)}>
              <Select.Content>
                <Select.Option value="all">Visible to All</Select.Option>
                <Select.Option value="architect-only">Architect Only</Select.Option>
              </Select.Content>
            </Select>
          </FormField>
        </div>

        {/* Milestone + Objective row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {milestones.length > 0 && (
            <FormField>
              <Label>Milestone</Label>
              <Select value={milestoneId} onChange={(v) => setMilestoneId(v as string)}>
                <Select.Content>
                  <Select.Option value="">None</Select.Option>
                  {milestones.map((m) => <Select.Option key={m.id} value={m.id}>{m.title}</Select.Option>)}
                </Select.Content>
              </Select>
            </FormField>
          )}
          {objectives.length > 0 && (
            <FormField>
              <Label>Objective</Label>
              <Select value={objectiveId} onChange={(v) => setObjectiveId(v as string)}>
                <Select.Content>
                  <Select.Option value="">None</Select.Option>
                  {objectives.map((o) => <Select.Option key={o.id} value={o.id}>{o.title}</Select.Option>)}
                </Select.Content>
              </Select>
            </FormField>
          )}
        </div>

        {/* Subtasks */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Subtasks</div>
          {subtasks.map((sub) => (
            <div key={sub.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <input
                type="text"
                value={sub.title}
                onChange={(e) => updateSubtask(sub.id, 'title', e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '13px' }}
              />
              <select
                value={sub.status}
                onChange={(e) => updateSubtask(sub.id, 'status', e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '12px' }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="date"
                value={sub.dueDate ?? ''}
                onChange={(e) => updateSubtask(sub.id, 'dueDate', e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '12px' }}
              />
              <Button size="condensed" color="critical" onClick={() => removeSubtask(sub.id)}>✕</Button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add subtask… (Enter)"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '13px' }}
            />
            <Button onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>Add</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
