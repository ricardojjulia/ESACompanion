import React, { useEffect, useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Objective } from '../../pages/Engagements';

interface ObjectiveModalProps {
  objective?: Objective;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ objective, onClose, onSave }) => {
  const [title, setTitle] = useState(objective?.title ?? '');
  const [description, setDescription] = useState(objective?.description ?? '');

  useEffect(() => {
    setTitle(objective?.title ?? '');
    setDescription(objective?.description ?? '');
  }, [objective]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim()) onSave(title.trim(), description.trim());
  };

  return (
    <Modal
      show
      title={objective ? 'Edit Objective' : 'Create Objective'}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="objective-form" variant="emphasized" disabled={!title.trim()}>
            {objective ? 'Save Objective' : 'Create Objective'}
          </Button>
        </div>
      }
    >
      <form id="objective-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Objective title</Label>
          <TextInput value={title} onChange={setTitle} placeholder="Describe the intended outcome" required />
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Add context or success criteria" rows={3} resize="vertical" />
        </FormField>
      </form>
    </Modal>
  );
};