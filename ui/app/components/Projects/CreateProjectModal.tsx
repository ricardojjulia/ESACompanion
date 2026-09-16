import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Project } from '../../types/project';

interface CreateProjectModalProps {
  onClose: () => void;
  onSave: (name: string, description: string, clientName: string, expectedDate: string) => void;
  project?: Project;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSave, project }) => {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [clientName, setClientName] = useState(project?.clientName ?? '');
  const [expectedDate, setExpectedDate] = useState(project?.expectedDate ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && clientName.trim()) {
      onSave(name, description, clientName, expectedDate);
    }
  };

  return (
    <Modal
      show
      title={project ? 'Edit Project' : 'Create New Project'}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-project" variant="emphasized" disabled={!name.trim() || !clientName.trim()}>
            {project ? 'Save Project' : 'Create Project'}
          </Button>
        </div>
      }
    >
      <form id="create-project" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Project Name</Label>
          <TextInput value={name} onChange={setName} placeholder="Enter project name" required />
        </FormField>
        <FormField required>
          <Label>Client Name</Label>
          <TextInput value={clientName} onChange={setClientName} placeholder="Enter client name" required />
        </FormField>
        <FormField>
          <Label>Expected Completion Date</Label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--dt-colors-border-container-default)', borderRadius: '6px', backgroundColor: 'var(--dt-colors-surface-container-default)', color: 'var(--dt-colors-text-primary)', fontSize: '14px', width: '100%' }}
          />
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Project description, goals, scope…" rows={4} resize="vertical" />
        </FormField>
      </form>
    </Modal>
  );
};
