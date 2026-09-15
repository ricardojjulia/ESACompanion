import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { FormField, Label, Select, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import { ClientInteraction, InteractionType, InteractionStatus } from '../types/client';

interface AccessibleEngagement {
  id: string;
  name: string;
  clientName: string;
}

interface CreateClientInteractionModalProps {
  onClose: () => void;
  onCreate: (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => void;
  engagements: AccessibleEngagement[];
  isManager: boolean;
  interaction?: ClientInteraction;
}

export const CreateClientInteractionModal: React.FC<CreateClientInteractionModalProps> = ({ onClose, onCreate, engagements, isManager, interaction }) => {
  const [clientName, setClientName] = useState(interaction?.clientName ?? '');
  const [contactPerson, setContactPerson] = useState(interaction?.contactPerson ?? '');
  const [interactionType, setInteractionType] = useState<InteractionType>(interaction?.interactionType ?? 'Meeting');
  const [date, setDate] = useState(interaction?.date ?? '');
  const [notes, setNotes] = useState(interaction?.notes ?? '');
  const [actionItems, setActionItems] = useState(
    Array.isArray(interaction?.actionItems)
      ? interaction.actionItems.map((item) => item.text).join('\n')
      : interaction?.actionItems ?? '',
  );
  const [status, setStatus] = useState<InteractionStatus>(interaction?.status ?? 'Scheduled');
  const [engagementId, setEngagementId] = useState(interaction?.engagementId ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !contactPerson || !date || (!isManager && !engagementId)) return;

    onCreate({
      clientName,
      contactPerson,
      interactionType,
      date,
      notes,
      actionItems,
      status,
      engagementId: engagementId || undefined,
    });
  };

  return (
    <Modal show title={interaction ? 'Edit Client Interaction' : 'New Client Interaction'} onDismiss={onClose} footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="create-client-interaction" variant="emphasized" disabled={!clientName || !contactPerson || !date || (!isManager && !engagementId)}>
          {interaction ? 'Save Interaction' : 'Create Interaction'}
        </Button>
      </div>
    }>
      <form id="create-client-interaction" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField required>
          <Label>Client Name</Label>
          <TextInput value={clientName} onChange={setClientName} placeholder="Company or client name" disabled={!isManager} required />
        </FormField>
        <FormField required={!isManager}>
          <Label>Engagement</Label>
          <Select value={engagementId} onChange={(value) => {
            const selectedEngagementId = value as string;
            setEngagementId(selectedEngagementId);
            const engagement = engagements.find((item) => item.id === selectedEngagementId);
            if (engagement) setClientName(engagement.clientName);
          }}>
            <Select.Content>
              {isManager && <Select.Option value="">No engagement</Select.Option>}
              {engagements.map((engagement) => <Select.Option key={engagement.id} value={engagement.id}>{engagement.name} ({engagement.clientName})</Select.Option>)}
            </Select.Content>
          </Select>
        </FormField>
        <FormField required>
          <Label>Contact Person</Label>
          <TextInput value={contactPerson} onChange={setContactPerson} placeholder="Primary contact name" required />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField>
            <Label>Interaction Type</Label>
            <Select value={interactionType} onChange={(value) => setInteractionType(value as InteractionType)}>
              <Select.Content>
                <Select.Option value="Meeting">Meeting</Select.Option>
                <Select.Option value="Call">Call</Select.Option>
                <Select.Option value="Email">Email</Select.Option>
                <Select.Option value="Follow-up">Follow-up</Select.Option>
                <Select.Option value="Review">Review</Select.Option>
              </Select.Content>
            </Select>
          </FormField>
          <FormField>
            <Label>Status</Label>
            <Select value={status} onChange={(value) => setStatus(value as InteractionStatus)}>
              <Select.Content>
                <Select.Option value="Scheduled">Scheduled</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select.Content>
            </Select>
          </FormField>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <FormField>
          <Label>Notes</Label>
          <TextArea value={notes} onChange={setNotes} placeholder="Meeting agenda, discussion points, outcomes..." rows={3} resize="vertical" />
        </FormField>
        <FormField>
          <Label>Action Items</Label>
          <TextArea value={actionItems} onChange={setActionItems} placeholder="Follow-up tasks, next steps, deliverables..." rows={3} resize="vertical" />
        </FormField>
      </form>
    </Modal>
  );
};
