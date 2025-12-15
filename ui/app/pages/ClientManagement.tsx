import React, { useState, useEffect } from 'react';
import { Heading } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';
import { CreateClientInteractionModal } from '../components/CreateClientInteractionModal';
import { ClientCard } from '../components/ClientCard';
import { EditClientModal } from '../components/EditClientModal';
import type { ClientInteraction, InteractionType, InteractionStatus, ClientInfo, ActionItem } from '../types/client';

// Types moved to shared file at app/types/client.ts to avoid circular imports

export const ClientManagement = ({ userAppId, isManager }: { userAppId: string | null; isManager: boolean }) => {
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Record<string, ClientInfo>>({});
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'scheduled' | 'completed'>('all');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInteractions();
    loadClients();
  }, []);

  const loadInteractions = () => {
    const stored = localStorage.getItem('esa-client-interactions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter by appId if not manager
        const filtered = isManager ? parsed : parsed.filter((i: any) => i.appId === userAppId);
        setInteractions(filtered);
      } catch (e) {
        console.error('Failed to parse client interactions:', e);
        setInteractions([]);
      }
    }
  };

  const loadClients = () => {
    const stored = localStorage.getItem('esa-clients');
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse clients:', e);
        setClients({});
      }
    }
  };

  const handleCreateInteraction = (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => {
    const newInteraction: ClientInteraction = {
      ...interaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      appId: userAppId || undefined,
    };

    const updated = [...interactions, newInteraction];
    setInteractions(updated);
    localStorage.setItem('esa-client-interactions', JSON.stringify(updated));
    setIsModalOpen(false);

    // Ensure client exists in registry
    const clientKey = newInteraction.clientName;
    if (!clients[clientKey]) {
      const newClient: ClientInfo = {
        id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
        name: clientKey,
        primaryContact: newInteraction.contactPerson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedClients = { ...clients, [clientKey]: newClient };
      setClients(updatedClients);
      localStorage.setItem('esa-clients', JSON.stringify(updatedClients));
    }
  };

  const handleUpdateStatus = (id: string, status: InteractionStatus) => {
    const updated = interactions.map((interaction) =>
      interaction.id === id ? { ...interaction, status } : interaction
    );
    setInteractions(updated);
    localStorage.setItem('esa-client-interactions', JSON.stringify(updated));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this interaction?')) {
      const updated = interactions.filter((interaction) => interaction.id !== id);
      setInteractions(updated);
      localStorage.setItem('esa-client-interactions', JSON.stringify(updated));
    }
  };

  const filteredInteractions = interactions.filter((interaction) => {
    if (viewMode === 'all') return true;
    if (viewMode === 'scheduled') return interaction.status === 'Scheduled';
    if (viewMode === 'completed') return interaction.status === 'Completed';
    return true;
  });

  // Group by client name
  const groupedByClient = filteredInteractions.reduce((acc, interaction) => {
    if (!acc[interaction.clientName]) {
      acc[interaction.clientName] = [];
    }
    acc[interaction.clientName].push(interaction);
    return acc;
  }, {} as Record<string, ClientInteraction[]>);

  const handleEditClient = (clientName: string) => {
    const client = clients[clientName] || {
      id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
      name: clientName,
      primaryContact: groupedByClient[clientName]?.[0]?.contactPerson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ClientInfo;
    const updatedClients = { ...clients, [clientName]: client };
    setClients(updatedClients);
    localStorage.setItem('esa-clients', JSON.stringify(updatedClients));
    setEditingClientId(client.id);
  };

  const handleSaveClient = (client: ClientInfo) => {
    // If name changed, re-key clients and update interactions clientName
    const previousName = Object.keys(clients).find((k) => clients[k].id === client.id) || client.name;
    let newClients = { ...clients };
    if (previousName !== client.name) {
      delete newClients[previousName];
      newClients[client.name] = client;
      const updatedInteractions = interactions.map((i) =>
        i.clientName === previousName ? { ...i, clientName: client.name } : i
      );
      setInteractions(updatedInteractions);
      localStorage.setItem('esa-client-interactions', JSON.stringify(updatedInteractions));
    } else {
      newClients[client.name] = client;
    }
    client.updatedAt = new Date().toISOString();
    setClients(newClients);
    localStorage.setItem('esa-clients', JSON.stringify(newClients));
    setEditingClientId(null);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Heading level={1} style={{ marginBottom: '8px' }}>
            Client Management
          </Heading>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px', margin: 0 }}>
            Track client interactions, meetings, and follow-ups
          </p>
          {importMessage && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: 'var(--dt-colors-surface-selected)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              {importMessage}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const raw = JSON.parse(String(reader.result));
                  if (!Array.isArray(raw)) throw new Error('Invalid JSON: expected an array');
                  const normalized: ClientInteraction[] = raw.map((i: any) => {
                    const type: InteractionType = (i.interactionType || i.type || 'Meeting');
                    let status: InteractionStatus = 'Scheduled';
                    switch (i.status) {
                      case 'Scheduled':
                      case 'Completed':
                      case 'Cancelled':
                        status = i.status;
                        break;
                      case 'Pending':
                      case 'In Progress':
                      case 'Planned':
                        status = 'Scheduled';
                        break;
                      case 'Finished':
                      case 'Done':
                        status = 'Completed';
                        break;
                      default:
                        status = 'Scheduled';
                    }
                    const actionItems = Array.isArray(i.actionItems) || typeof i.actionItems === 'string' ? i.actionItems : '';
                    return {
                      id: i.id || Date.now().toString() + Math.random().toString(36).slice(2),
                      clientName: i.clientName || 'Unknown Client',
                      contactPerson: i.contactPerson || 'Unknown Contact',
                      interactionType: type,
                      date: i.date || new Date().toISOString(),
                      notes: i.notes || '',
                      actionItems,
                      status,
                      createdAt: i.createdAt || new Date().toISOString(),
                    };
                  });
                  setInteractions(normalized);
                  localStorage.setItem('esa-client-interactions', JSON.stringify(normalized));
                  
                  // Ensure clients exist for imported interactions
                  const storedClients = localStorage.getItem('esa-clients');
                  const clientsObj: Record<string, ClientInfo> = storedClients ? JSON.parse(storedClients) : {};
                  let changed = false;
                  normalized.forEach((interaction) => {
                    if (!clientsObj[interaction.clientName]) {
                      clientsObj[interaction.clientName] = {
                        id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
                        name: interaction.clientName,
                        primaryContact: interaction.contactPerson || '',
                        notes: '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      changed = true;
                    }
                  });
                  if (changed) {
                    localStorage.setItem('esa-clients', JSON.stringify(clientsObj));
                  }
                  
                  setImportMessage(`Imported ${normalized.length} interaction(s) successfully.`);
                } catch (err) {
                  alert('Failed to import interactions JSON. Please check the file format.');
                  console.error(err);
                } finally {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              };
              reader.readAsText(file);
            }}
          />
          <button
            onClick={() => {
              const data = JSON.stringify(interactions, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'esa-client-interactions.json';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Download interactions JSON"
          >
            ⬇️ Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--dt-colors-surface-container-default)',
              border: '1px solid var(--dt-colors-border-container-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Upload interactions JSON"
          >
            ⬆️ Import JSON
          </button>
          <Button onClick={() => setIsModalOpen(true)}>
            + New Interaction
          </Button>
        </div>
      </div>

      {/* View Mode Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setViewMode('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--dt-colors-border-container-default)',
            backgroundColor: viewMode === 'all' ? 'var(--dt-colors-surface-selected)' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          All ({interactions.length})
        </button>
        <button
          onClick={() => setViewMode('scheduled')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--dt-colors-border-container-default)',
            backgroundColor: viewMode === 'scheduled' ? 'var(--dt-colors-surface-selected)' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Scheduled ({interactions.filter((i) => i.status === 'Scheduled').length})
        </button>
        <button
          onClick={() => setViewMode('completed')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--dt-colors-border-container-default)',
            backgroundColor: viewMode === 'completed' ? 'var(--dt-colors-surface-selected)' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Completed ({interactions.filter((i) => i.status === 'Completed').length})
        </button>
      </div>

      {/* Interactions List */}
      {Object.keys(groupedByClient).length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            backgroundColor: 'var(--dt-colors-surface-container-default)',
            borderRadius: '8px',
            border: '1px solid var(--dt-colors-border-container-default)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
          <Heading level={3}>No client interactions yet</Heading>
          <p style={{ color: 'var(--dt-colors-text-secondary)', marginBottom: '24px' }}>
            Start tracking your client meetings, calls, and follow-ups
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Interaction</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedByClient)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([clientName, clientInteractions]) => (
              <ClientCard
                key={clientName}
                clientName={clientName}
                interactions={clientInteractions}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                clientId={clients[clientName]?.id}
                onEditClient={() => handleEditClient(clientName)}
              />
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <CreateClientInteractionModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateInteraction}
        />
      )}

      {editingClientId && (
        <EditClientModal
          client={Object.values(clients).find((c) => c.id === editingClientId)!}
          onClose={() => setEditingClientId(null)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
};
