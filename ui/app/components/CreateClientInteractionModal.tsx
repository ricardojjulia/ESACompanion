import React, { useState } from 'react';
import { ClientInteraction, InteractionType, InteractionStatus } from '../types/client';

interface CreateClientInteractionModalProps {
  onClose: () => void;
  onCreate: (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => void;
}

export const CreateClientInteractionModal: React.FC<CreateClientInteractionModalProps> = ({ onClose, onCreate }) => {
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [interactionType, setInteractionType] = useState<InteractionType>('Meeting');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [status, setStatus] = useState<InteractionStatus>('Scheduled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !contactPerson || !date) return;

    onCreate({
      clientName,
      contactPerson,
      interactionType,
      date,
      notes,
      actionItems,
      status,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '40px',
          borderRadius: '12px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '3px solid #2196f3',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>New Client Interaction</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Client Name *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Company or client name"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Contact Person *
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Primary contact name"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Interaction Type
              </label>
              <select
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Meeting">Meeting</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Review">Review</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InteractionStatus)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting agenda, discussion points, outcomes..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Action Items
            </label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="Follow-up tasks, next steps, deliverables..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clientName || !contactPerson || !date}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: clientName && contactPerson && date ? '#2196f3' : '#ccc',
                color: '#fff',
                cursor: clientName && contactPerson && date ? 'pointer' : 'not-allowed',
              }}
            >
              Create Interaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
