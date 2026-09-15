import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, Select, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import type { Engagement } from '../../pages/Engagements';

interface CreateEngagementModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, clientName: string, assignedClientAppIds: string[]) => void;
  configuredAppIds: string[];
  engagement?: Engagement;
}

export const CreateEngagementModal: React.FC<CreateEngagementModalProps> = ({
  onClose,
  onCreate,
  configuredAppIds,
  engagement,
}) => {
  const [name, setName] = useState(engagement?.name ?? '');
  const [description, setDescription] = useState(engagement?.description ?? '');
  const [clientName, setClientName] = useState(engagement?.clientName ?? '');
  const [assignedClientAppIds, setAssignedClientAppIds] = useState<string[]>(engagement?.assignedClientAppIds ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && clientName.trim()) {
      onCreate(name, description, clientName, assignedClientAppIds);
    }
  };

  return (
    <Modal show title={engagement ? 'Edit Engagement' : 'Create New Engagement'} onDismiss={onClose} footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="create-engagement" variant="emphasized" disabled={!name.trim() || !clientName.trim()}>
          {engagement ? 'Save Engagement' : 'Create Engagement'}
        </Button>
      </div>
    }>
      <form id="create-engagement" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Engagement Name</Label>
          <TextInput value={name} onChange={setName} placeholder="Enter engagement name" required />
        </FormField>
        <FormField required>
          <Label>Client Name</Label>
          <TextInput value={clientName} onChange={setClientName} placeholder="Enter client name" required />
        </FormField>
        <FormField>
          <Label>Assigned Client APPIDs</Label>
          <Select<string, true>
            aria-label="Assigned Client APPIDs"
            multiple
            value={assignedClientAppIds}
            onChange={(value) => setAssignedClientAppIds([...value])}
          >
            <Select.Content>
              {configuredAppIds.map((appId) => <Select.Option key={appId} value={appId}>{appId}</Select.Option>)}
            </Select.Content>
          </Select>
        </FormField>
        <FormField>
          <Label>Description</Label>
          <TextArea value={description} onChange={setDescription} placeholder="Enter engagement description" rows={4} resize="vertical" />
        </FormField>
      </form>
    </Modal>
  );
};
