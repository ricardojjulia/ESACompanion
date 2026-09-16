import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Heading } from '@dynatrace/strato-components/typography';
import { FormField, Label, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Milestone, Task } from '../../types/project';

interface MilestoneModalProps {
  milestone?: Milestone;
  onClose: () => void;
  onSave: (title: string, description: string, dueDate: string) => void;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({ milestone, onClose, onSave }) => {
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? '');

  return (
    <Modal
      show
      title={milestone ? 'Edit Milestone' : 'New Milestone'}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="milestone-form" variant="emphasized" disabled={!title.trim()}>
            {milestone ? 'Save' : 'Create'}
          </Button>
        </div>
      }
    >
      <form id="milestone-form" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave(title, description, dueDate); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Milestone Title</Label>
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Phase 1 Complete, Go-Live, Handoff" required />
        </FormField>
        <FormField>
          <Label>Description / Completion Criteria</Label>
          <TextArea value={description} onChange={setDescription} placeholder="What does success look like?" rows={3} resize="vertical" />
        </FormField>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
          <span style={{ fontWeight: 500 }}>Target Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '14px' }}
          />
        </label>
      </form>
    </Modal>
  );
};

interface MilestonesSectionProps {
  milestones: Milestone[];
  tasks: Task[];
  isManager: boolean;
  onAdd: (title: string, description: string, dueDate: string) => void;
  onEdit: (id: string, title: string, description: string, dueDate: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  milestones, tasks, isManager, onAdd, onEdit, onDelete, onComplete,
}) => {
  const [editing, setEditing] = useState<Milestone | null | undefined>(undefined);

  if (milestones.length === 0 && !isManager) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <Heading level={3}>Milestones</Heading>
        {isManager && <Button onClick={() => setEditing(null)}>+ Milestone</Button>}
      </div>

      {milestones.length === 0 ? (
        <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px' }}>No milestones defined yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {milestones.map((ms) => {
            const linked = tasks.filter((t) => t.milestoneId === ms.id && t.visibility !== 'architect-only');
            const done = linked.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
            const pct = linked.length > 0 ? Math.round((done / linked.length) * 100) : 0;
            const isComplete = !!ms.completedAt;
            const isOverdue = ms.dueDate && !isComplete && new Date(ms.dueDate) < new Date();

            return (
              <div
                key={ms.id}
                style={{
                  padding: '14px 16px',
                  border: `1px solid ${isComplete ? 'var(--dt-colors-border-container-default)' : isOverdue ? 'var(--dt-colors-background-critical-default)' : 'var(--dt-colors-border-container-default)'}`,
                  borderLeft: `4px solid ${isComplete ? 'var(--dt-colors-background-success-default)' : isOverdue ? 'var(--dt-colors-background-critical-default)' : '#6366f1'}`,
                  borderRadius: '8px',
                  opacity: isComplete ? 0.75 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, textDecoration: isComplete ? 'line-through' : 'none' }}>{ms.title}</span>
                      {isComplete && <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-success)', fontWeight: 600 }}>✓ Completed {new Date(ms.completedAt!).toLocaleDateString()}</span>}
                      {isOverdue && !isComplete && <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-critical)', fontWeight: 600 }}>⚠ Overdue</span>}
                    </div>
                    {ms.description && <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px' }}>{ms.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {ms.dueDate && <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>Target: {new Date(ms.dueDate).toLocaleDateString()}</span>}
                      {linked.length > 0 && (
                        <>
                          <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>{done}/{linked.length} tasks complete</span>
                          <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--dt-colors-background-success-default)' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600 }}>{pct}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isManager && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!isComplete && (
                        <Button size="condensed" onClick={() => onComplete(ms.id)}>Mark Done</Button>
                      )}
                      <Button size="condensed" onClick={() => setEditing(ms)}>Edit</Button>
                      <Button size="condensed" color="critical" onClick={() => { if (confirm(`Delete milestone "${ms.title}"?`)) onDelete(ms.id); }}>Delete</Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <MilestoneModal
          milestone={editing ?? undefined}
          onClose={() => setEditing(undefined)}
          onSave={(title, description, dueDate) => {
            if (editing) {
              onEdit(editing.id, title, description, dueDate);
            } else {
              onAdd(title, description, dueDate);
            }
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
};
