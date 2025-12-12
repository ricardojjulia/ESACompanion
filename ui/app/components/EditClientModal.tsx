import React, { useState } from 'react';
import { Heading } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';
import { ClientInfo } from '../types/client';

interface EditClientModalProps {
  client: ClientInfo;
  onClose: () => void;
  onSave: (client: ClientInfo) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSave }) => {
  const [name, setName] = useState(client.name);
  const [primaryContact, setPrimaryContact] = useState(client.primaryContact || '');
  const [notes, setNotes] = useState(client.notes || '');

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
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          border: '3px solid #2196f3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Heading level={3} style={{ marginBottom: '12px', color: '#000' }}>Edit Client</Heading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: '#000' }}>
            Client Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: '#f9f9f9',
                color: '#000'
              }}
            />
          </label>
          <label style={{ fontSize: '13px', color: '#000' }}>
            Primary Contact
            <input
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: '#f9f9f9',
                color: '#000'
              }}
            />
          </label>
          <label style={{ fontSize: '13px', color: '#000' }}>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: '#f9f9f9',
                color: '#000'
              }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="emphasized"
            onClick={() => {
              const updated: ClientInfo = {
                ...client,
                name: name.trim() || client.name,
                primaryContact: primaryContact.trim() || client.primaryContact,
                notes: notes,
                updatedAt: new Date().toISOString(),
              };
              onSave(updated);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
