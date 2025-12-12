import React from 'react';
import { Heading } from '@dynatrace/strato-components/typography';
import { ClientInteraction, InteractionStatus } from '../types/client';

interface ClientCardProps {
  clientName: string;
  clientId?: string;
  interactions: ClientInteraction[];
  onUpdateStatus: (id: string, status: InteractionStatus) => void;
  onDelete: (id: string) => void;
  onEditClient?: () => void;
}

const getStatusColor = (status: InteractionStatus) => {
  switch (status) {
    case 'Scheduled':
      return '#2196f3';
    case 'Completed':
      return '#4caf50';
    case 'Cancelled':
      return '#757575';
    default:
      return '#757575';
  }
};

const getInteractionTypeIcon = (type: string) => {
  switch (type) {
    case 'Meeting':
      return '👥';
    case 'Call':
      return '📞';
    case 'Email':
      return '📧';
    case 'Follow-up':
      return '🔄';
    case 'Review':
      return '📋';
    default:
      return '📝';
  }
};

export const ClientCard: React.FC<ClientCardProps> = ({ clientName, clientId, interactions, onUpdateStatus, onDelete, onEditClient }) => {
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
          {onEditClient && (
            <button
              onClick={onEditClient}
              title="Edit client"
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--dt-colors-surface-default)',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit
            </button>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
          {interactions.length} interaction{interactions.length !== 1 ? 's' : ''} • {completedCount} completed
        </div>
      </div>

      {/* Interactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                <span style={{ fontSize: '20px' }}>{getInteractionTypeIcon(interaction.interactionType)}</span>
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={interaction.status}
                  onChange={(e) => onUpdateStatus(interaction.id, e.target.value as InteractionStatus)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--dt-colors-surface-default)',
                    color: getStatusColor(interaction.status),
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => onDelete(interaction.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#d32f2f',
                  }}
                  title="Delete interaction"
                >
                  🗑️
                </button>
              </div>
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
