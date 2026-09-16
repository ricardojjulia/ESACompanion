import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Objective } from '../../types/project';

interface ObjectiveModalProps {
  objective?: Objective;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ objective, onClose, onSave }) => {
  const [title, setTitle] = useState(objective?.title ?? '');
  const [description, setDescription] = useState(objective?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) onSave(title, description);
  };

  return (
    <Modal
      show
      title={objective ? 'Edit Objective' : 'New Objective'}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="objective-form" variant="emphasized" disabled={!title.trim()}>
            {objective ? 'Save' : 'Create'}
          </Button>
        </div>
      }
    >
      <form id="objective-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Objective Title</Label>
          <TextInput value={title} onChange={setTitle} placeholder="Enter objective title" required />
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Describe what success looks like…" rows={3} resize="vertical" />
        </FormField>
      </form>
    </Modal>
  );
};
