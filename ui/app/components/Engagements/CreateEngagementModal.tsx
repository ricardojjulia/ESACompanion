import React, { useState } from 'react';
import { Button } from '@dynatrace/strato-components';

interface CreateEngagementModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, clientName: string) => void;
}

export const CreateEngagementModal: React.FC<CreateEngagementModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && clientName.trim()) {
      onCreate(name, description, clientName);
    }
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
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          border: '3px solid #2196f3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
          Create New Engagement
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              htmlFor="engagement-name"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Engagement Name *
            </label>
            <input
              id="engagement-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter engagement name"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--dt-colors-background-input-default)',
                border: '1px solid var(--dt-colors-border-input-default)',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="engagement-client"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Client Name *
            </label>
            <input
              id="engagement-client"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--dt-colors-background-input-default)',
                border: '1px solid var(--dt-colors-border-input-default)',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="engagement-description"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Description
            </label>
            <textarea
              id="engagement-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter engagement description"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--dt-colors-background-input-default)',
                border: '1px solid var(--dt-colors-border-input-default)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={!name.trim() || !clientName.trim()}>
              Create Engagement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
