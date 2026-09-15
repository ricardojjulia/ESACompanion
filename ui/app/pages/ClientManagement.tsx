import React, { useState, useEffect } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Heading } from '@dynatrace/strato-components/typography';
import { EmptyState, MessageContainer } from '@dynatrace/strato-components-preview/content';
import { CreateClientInteractionModal } from '../components/CreateClientInteractionModal';
import { ClientCard } from '../components/ClientCard';
import { EditClientModal } from '../components/EditClientModal';
import type { ClientInteraction, InteractionType, InteractionStatus, ClientInfo, ActionItem } from '../types/client';
import type { Engagement } from './Engagements';
import {
  isClientInteractionMutableByUser,
  isClientInteractionVisibleToUser,
  isEngagementVisibleToUser,
} from '../utils/partitionedCollection';
import {
  type ClientRegistry,
  findVisibleClient,
  getClientRegistryKey,
  getVisibleClients,
  parseClientRegistry,
} from '../utils/clientRegistry';

// Types moved to shared file at app/types/client.ts to avoid circular imports

export const ClientManagement = ({ userAppId, isManager }: { userAppId: string | null; isManager: boolean }) => {
  const [allInteractions, setAllInteractions] = useState<ClientInteraction[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientRegistry>({});
  const [editingClient, setEditingClient] = useState<ClientInfo | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<ClientInteraction | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'scheduled' | 'completed'>('all');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInteractions();
    loadClients();
    const storedEngagements = localStorage.getItem('esa-engagements');
    try {
      const parsed = storedEngagements ? JSON.parse(storedEngagements) : [];
      setEngagements(Array.isArray(parsed) ? parsed.filter((engagement: Engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager)) : []);
    } catch (error) {
      console.error('Failed to parse engagements:', error);
      setEngagements([]);
    }
  }, [userAppId, isManager]);

  const loadInteractions = () => {
    const stored = localStorage.getItem('esa-client-interactions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAllInteractions(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse client interactions:', e);
        setAllInteractions([]);
      }
    }
  };

  const interactions = allInteractions.filter((interaction) =>
    isClientInteractionVisibleToUser(interaction, engagements, userAppId, isManager),
  );

  const persistInteractions = (nextVisibleInteractions: ClientInteraction[]) => {
    const merged = isManager
      ? nextVisibleInteractions
      : [
          ...allInteractions.map((interaction) => nextVisibleInteractions.find((candidate) => candidate.id === interaction.id) ?? interaction),
          ...nextVisibleInteractions.filter((interaction) => !allInteractions.some((existing) => existing.id === interaction.id)),
        ];
    setAllInteractions(merged);
    localStorage.setItem('esa-client-interactions', JSON.stringify(merged));
  };

  const persistEngagementClientRename = (previousName: string, nextName: string) => {
    try {
      const stored = localStorage.getItem('esa-engagements');
      const allEngagements: Engagement[] = stored ? JSON.parse(stored) : [];
      const visibleEngagements = allEngagements
        .filter((engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager))
        .map((engagement) =>
          isManager && normalizeClientName(engagement.clientName) === normalizeClientName(previousName)
            ? { ...engagement, clientName: nextName }
            : engagement,
        );
      localStorage.setItem(
        'esa-engagements',
        JSON.stringify(isManager ? visibleEngagements : allEngagements),
      );
      setEngagements(visibleEngagements);
    } catch (error) {
      console.error('Failed to update linked engagement client names:', error);
    }
  };

  const loadClients = () => {
    const stored = localStorage.getItem('esa-clients');
    try {
      setClients(parseClientRegistry(stored));
    } catch (e) {
      console.error('Failed to parse clients:', e);
      setClients({});
    }
  };

  const persistClients = (nextClients: ClientRegistry) => {
    setClients(nextClients);
    localStorage.setItem('esa-clients', JSON.stringify(nextClients));
  };

  const normalizeClientName = (name: string) => name.trim().toLocaleLowerCase();

  const ensureClient = (name: string, primaryContact = '') => {
    if (!isManager) return;

    const appId = undefined;
    const existing = Object.values(clients).find(
      (client) => client.appId === appId && normalizeClientName(client.name) === normalizeClientName(name),
    );
    if (existing) return;

    const now = new Date().toISOString();
    const client: ClientInfo = {
      id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
      name: name.trim(),
      primaryContact,
      createdAt: now,
      updatedAt: now,
      appId,
    };
    persistClients({ ...clients, [getClientRegistryKey(client.name, client.appId)]: client });
  };

  const handleCreateInteraction = (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => {
    const engagement = interaction.engagementId
      ? engagements.find((candidate) => candidate.id === interaction.engagementId)
      : undefined;
    if (!isManager && (!userAppId || !engagement)) {
      setImportMessage('Unable to create an update for an inaccessible engagement.');
      return;
    }
    const newInteraction: ClientInteraction = {
      ...interaction,
      clientName: engagement?.clientName ?? interaction.clientName,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      appId: isManager ? undefined : userAppId ?? undefined,
      submittedByAppId: isManager ? undefined : userAppId ?? undefined,
    };

    persistInteractions([...interactions, newInteraction]);
    setIsModalOpen(false);

    if (isManager) ensureClient(newInteraction.clientName, newInteraction.contactPerson);
  };

  const handleSaveInteraction = (interaction: Omit<ClientInteraction, 'id' | 'createdAt'>) => {
    if (!isManager || !editingInteraction) {
      setImportMessage('Only administrators can edit client updates.');
      return;
    }
    const engagement = interaction.engagementId
      ? engagements.find((candidate) => candidate.id === interaction.engagementId)
      : undefined;
    if (interaction.engagementId && !engagement) {
      setImportMessage('Select a valid linked engagement before saving.');
      return;
    }
    const updatedInteraction: ClientInteraction = {
      ...editingInteraction,
      ...interaction,
      clientName: engagement?.clientName ?? interaction.clientName,
    };
    persistInteractions(interactions.map((item) => item.id === updatedInteraction.id ? updatedInteraction : item));
    setEditingInteraction(null);
  };

  const handleUpdateStatus = (id: string, status: InteractionStatus) => {
    const interaction = interactions.find((item) => item.id === id);
    if (!isManager) {
      setImportMessage('Only administrators can edit client updates.');
      return;
    }
    if (!interaction) return;
    const updated = interactions.map((interaction) =>
      interaction.id === id ? { ...interaction, status } : interaction
    );
    persistInteractions(updated);
  };

  const handleDelete = (id: string) => {
    const interaction = interactions.find((item) => item.id === id);
    if (!isManager) {
      setImportMessage('Only administrators can delete client updates.');
      return;
    }
    if (!interaction) return;
    if (confirm('Are you sure you want to delete this interaction?')) {
      const updated = interactions.filter((interaction) => interaction.id !== id);
      persistInteractions(updated);
    }
  };

  const handleImportInteractions = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManager) {
      setImportMessage('Only administrators can import client updates.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw: unknown = JSON.parse(String(reader.result));
        if (!Array.isArray(raw)) throw new Error('Invalid JSON: expected an array');
        const normalized: ClientInteraction[] = raw.map((item: any, index: number) => {
          if (typeof item.engagementId !== 'string') throw new Error(`Update ${index + 1} must include an engagementId`);
          const engagement = engagements.find((candidate) => candidate.id === item.engagementId);
          if (!engagement || typeof item.clientName !== 'string' || item.clientName !== engagement.clientName) {
            throw new Error(`Update ${index + 1} must reference its linked engagement and client name`);
          }
          return {
            id: String(item.id ?? `interaction-${Date.now()}-${index}`),
            clientName: engagement.clientName,
            contactPerson: String(item.contactPerson ?? 'Unknown Contact'),
            interactionType: item.interactionType || item.type || 'Meeting',
            date: String(item.date ?? new Date().toISOString()),
            notes: String(item.notes ?? ''),
            actionItems: Array.isArray(item.actionItems) || typeof item.actionItems === 'string' ? item.actionItems : '',
            status: ['Scheduled', 'Completed', 'Cancelled'].includes(item.status) ? item.status : 'Scheduled',
            createdAt: String(item.createdAt ?? new Date().toISOString()),
            engagementId: engagement.id,
          };
        });
        const existingIds = new Set(interactions.map((interaction) => interaction.id));
        const newInteractions = normalized.filter((interaction) => !existingIds.has(interaction.id));
        persistInteractions([...interactions, ...newInteractions]);
        setImportMessage(`Imported ${newInteractions.length} new interaction(s) successfully. (${normalized.length - newInteractions.length} duplicates skipped)`);
      } catch (error) {
        setImportMessage(error instanceof Error ? error.message : 'Failed to import client updates.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
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
    const client = findVisibleClient(clients, clientName, userAppId, isManager);
    if (!isManager) return;
    const editableClient = client || {
      id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
      name: clientName,
      primaryContact: groupedByClient[clientName]?.[0]?.contactPerson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appId: isManager ? undefined : userAppId || undefined,
    } as ClientInfo;
    if (!client) persistClients({ ...clients, [getClientRegistryKey(editableClient.name, editableClient.appId)]: editableClient });
    setEditingClient(editableClient);
  };

  const handleCreateClient = () => {
    if (!isManager) return;

    const now = new Date().toISOString();
    setEditingClient({
      id: 'cli-' + Date.now().toString() + Math.random().toString(36).slice(2),
      name: '',
      primaryContact: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleDeleteClient = (clientName: string) => {
    if (!isManager) return;

    const registryEntry = Object.entries(clients).find(([, client]) =>
      normalizeClientName(client.name) === normalizeClientName(clientName),
    );
    if (!registryEntry) return;
    if (!confirm(`Delete ${registryEntry[1].name} from the client registry? Historical engagements, tasks, objectives, and interactions will be preserved.`)) return;

    const nextClients = { ...clients };
    delete nextClients[registryEntry[0]];
    persistClients(nextClients);
  };

  const handleSaveClient = (client: ClientInfo) => {
    const registryEntry = Object.entries(clients).find(([, item]) => item.id === client.id);
    const previousClient = registryEntry?.[1];
    if (!isManager) return;
    if (!previousClient && !client.name.trim()) {
      setImportMessage('A client name is required.');
      return;
    }

    const previousName = previousClient?.name || client.name;
    const savedClient = { ...client, appId: previousClient?.appId, updatedAt: new Date().toISOString() };
    let newClients = { ...clients };
    if (registryEntry) delete newClients[registryEntry[0]];
    newClients[getClientRegistryKey(savedClient.name, savedClient.appId)] = savedClient;
    if (normalizeClientName(previousName) !== normalizeClientName(savedClient.name)) {
      const updatedInteractions = interactions.map((i) =>
        normalizeClientName(i.clientName) === normalizeClientName(previousName)
          ? { ...i, clientName: savedClient.name }
          : i,
      );
      persistInteractions(updatedInteractions);
      persistEngagementClientRename(previousName, savedClient.name);
    }
    persistClients(newClients);
    setEditingClient(null);
  };

  const clientNames = Array.from(new Set([
    ...Object.keys(groupedByClient),
    ...getVisibleClients(clients, userAppId, isManager).map((client) => client.name),
  ]));

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
            <MessageContainer style={{ marginTop: '8px' }}>{importMessage}</MessageContainer>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportInteractions}
          />
          {isManager && <Button
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
          >
            Export JSON
          </Button>}
          {isManager && <Button onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </Button>}
          {isManager && <Button variant="emphasized" onClick={handleCreateClient}>
            Create Client
          </Button>}
          <Button variant="emphasized" disabled={!isManager && engagements.length === 0} onClick={() => setIsModalOpen(true)}>
            New Interaction
          </Button>
        </div>
      </div>

      {/* View Mode Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <Button variant={viewMode === 'all' ? 'emphasized' : 'default'} onClick={() => setViewMode('all')}>
          All ({interactions.length})
        </Button>
        <Button variant={viewMode === 'scheduled' ? 'emphasized' : 'default'} onClick={() => setViewMode('scheduled')}>
          Scheduled ({interactions.filter((i) => i.status === 'Scheduled').length})
        </Button>
        <Button variant={viewMode === 'completed' ? 'emphasized' : 'default'} onClick={() => setViewMode('completed')}>
          Completed ({interactions.filter((i) => i.status === 'Completed').length})
        </Button>
      </div>

      {/* Interactions List */}
      {clientNames.length === 0 ? (
        <EmptyState>
          <EmptyState.Title>No client interactions yet</EmptyState.Title>
          <EmptyState.Details>Start tracking your client meetings, calls, and follow-ups.</EmptyState.Details>
          <EmptyState.Actions><Button variant="emphasized" disabled={!isManager && engagements.length === 0} onClick={() => setIsModalOpen(true)}>Create First Interaction</Button></EmptyState.Actions>
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {clientNames
            .sort((left, right) => left.localeCompare(right))
            .map((clientName) => (
              <ClientCard
                key={clientName}
                clientName={clientName}
                interactions={groupedByClient[clientName] ?? []}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onEditInteraction={isManager ? setEditingInteraction : undefined}
                clientId={findVisibleClient(clients, clientName, userAppId, isManager)?.id}
                onEditClient={isManager ? () => handleEditClient(clientName) : undefined}
                onDeleteClient={isManager ? () => handleDeleteClient(clientName) : undefined}
                canEditClient={isManager}
                canManageInteractions={isManager}
                isInteractionMutable={(interaction) => isClientInteractionMutableByUser(interaction, userAppId, isManager)}
              />
            ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <CreateClientInteractionModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateInteraction}
          engagements={engagements}
          isManager={isManager}
        />
      )}

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSaveClient}
          title={Object.values(clients).some((client) => client.id === editingClient.id) ? 'Edit Client' : 'Create Client'}
          submitLabel={Object.values(clients).some((client) => client.id === editingClient.id) ? 'Save' : 'Create Client'}
        />
      )}

      {editingInteraction && (
        <CreateClientInteractionModal
          interaction={editingInteraction}
          onClose={() => setEditingInteraction(null)}
          onCreate={handleSaveInteraction}
          engagements={engagements}
          isManager={isManager}
        />
      )}
    </div>
  );
};
