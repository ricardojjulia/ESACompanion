import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import { ClientInfo } from '../types/client';

interface EditClientModalProps {
  client: ClientInfo;
  onClose: () => void;
  onSave: (client: ClientInfo) => void;
  title?: string;
  submitLabel?: string;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  onClose,
  onSave,
  title = 'Edit Client',
  submitLabel = 'Save',
}) => {
  const [name, setName] = useState(client.name);
  const [primaryContact, setPrimaryContact] = useState(client.primaryContact || '');
  const [notes, setNotes] = useState(client.notes || '');

  return (
    <Modal
      show
      title={title}
      onDismiss={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="emphasized"
            onClick={() => onSave({
              ...client,
              name: name.trim() || client.name,
              primaryContact: primaryContact.trim() || client.primaryContact,
              notes,
              updatedAt: new Date().toISOString(),
            })}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField>
          <Label>Client Name</Label>
          <TextInput value={name} onChange={setName} />
        </FormField>
        <FormField>
          <Label>Primary Contact</Label>
          <TextInput value={primaryContact} onChange={setPrimaryContact} />
        </FormField>
        <FormField>
          <Label>Notes</Label>
          <TextArea value={notes} onChange={setNotes} rows={4} resize="vertical" />
        </FormField>
      </div>
    </Modal>
  );
};
