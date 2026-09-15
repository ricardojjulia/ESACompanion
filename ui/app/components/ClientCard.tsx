import React from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Heading } from '@dynatrace/strato-components/typography';
import { Select } from '@dynatrace/strato-components-preview/forms';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { DeleteIcon, EditIcon } from '@dynatrace/strato-icons';
import { ClientInteraction, InteractionStatus } from '../types/client';

interface ClientCardProps {
  clientName: string;
  clientId?: string;
  interactions: ClientInteraction[];
  onUpdateStatus: (id: string, status: InteractionStatus) => void;
  onDelete: (id: string) => void;
  onEditInteraction?: (interaction: ClientInteraction) => void;
  onEditClient?: () => void;
  onDeleteClient?: () => void;
  canEditClient: boolean;
  canManageInteractions: boolean;
  isInteractionMutable: (interaction: ClientInteraction) => boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ clientName, clientId, interactions, onUpdateStatus, onDelete, onEditInteraction, onEditClient, onDeleteClient, canEditClient, canManageInteractions, isInteractionMutable }) => {
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const completedCount = interactions.filter((i) => i.status === 'Completed').length;

  return (
    <div
      style={{
        backgroundColor: 'var(--dt-colors-surface-container-default)',
        border: '1px solid var(--dt-colors-border-container-default)',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      {/* Client Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heading level={3} style={{ margin: 0, marginBottom: '4px' }}>
            {clientName}
          </Heading>
          {clientId && (
            <span style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>• ID: {clientId}</span>
          )}
          {onEditClient && canEditClient && (
            <Tooltip text="Edit client">
              <Button aria-label="Edit client" size="condensed" onClick={onEditClient}><EditIcon /></Button>
            </Tooltip>
          )}
          {onDeleteClient && canEditClient && (
            <Tooltip text="Delete client">
              <Button aria-label="Delete client" size="condensed" color="critical" onClick={onDeleteClient}><DeleteIcon /></Button>
            </Tooltip>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
          {interactions.length} interaction{interactions.length !== 1 ? 's' : ''} • {completedCount} completed
        </div>
      </div>

      {/* Interactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedInteractions.length === 0 && (
          <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px' }}>
            No client interactions yet.
          </div>
        )}
        {sortedInteractions.map((interaction) => (
          <div
            key={interaction.id}
            style={{
              backgroundColor: 'var(--dt-colors-surface-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {interaction.interactionType} with {interaction.contactPerson}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    {new Date(interaction.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              {canManageInteractions && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Select aria-label="Interaction status" value={interaction.status} disabled={!isInteractionMutable(interaction)} onChange={(value) => onUpdateStatus(interaction.id, value as InteractionStatus)}>
                    <Select.Content>
                      <Select.Option value="Scheduled">Scheduled</Select.Option>
                      <Select.Option value="Completed">Completed</Select.Option>
                      <Select.Option value="Cancelled">Cancelled</Select.Option>
                    </Select.Content>
                  </Select>
                  {onEditInteraction && isInteractionMutable(interaction) && (
                    <Tooltip text="Edit interaction">
                      <Button aria-label="Edit interaction" size="condensed" onClick={() => onEditInteraction(interaction)}><EditIcon /></Button>
                    </Tooltip>
                  )}
                  {isInteractionMutable(interaction) && (
                    <Tooltip text="Delete interaction">
                      <Button aria-label="Delete interaction" size="condensed" color="critical" onClick={() => onDelete(interaction.id)}><DeleteIcon /></Button>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {interaction.notes && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
                  NOTES
                </div>
                <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-primary)', whiteSpace: 'pre-wrap' }}>
                  {interaction.notes}
                </div>
              </div>
            )}

            {interaction.actionItems && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
                  ACTION ITEMS
                </div>
                {Array.isArray(interaction.actionItems) ? (
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {interaction.actionItems.map((ai, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: 'var(--dt-colors-text-primary)' }}>
                        <span style={{ fontWeight: 600 }}>{ai.text}</span>
                        {ai.owner ? ` — ${ai.owner}` : ''}
                        {ai.dueDate ? ` (due ${new Date(ai.dueDate).toLocaleDateString('en-US')})` : ''}
                        {ai.status ? (
                          <span style={{
                            marginLeft: '6px',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: '1px solid var(--dt-colors-border-container-default)'
                          }}>
                            {ai.status}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-primary)', whiteSpace: 'pre-wrap' }}>
                    {interaction.actionItems as string}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
