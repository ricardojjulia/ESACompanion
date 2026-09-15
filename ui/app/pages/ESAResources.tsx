import React, { useState } from 'react';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Select, TextArea, TextInput } from '@dynatrace/strato-components-preview/forms';
import { Chip } from '@dynatrace/strato-components-preview/content';
import { Modal } from '@dynatrace/strato-components-preview/overlays';
import { DocumentStackIcon, EducationIcon, GroupIcon, SettingIcon } from '@dynatrace/strato-icons';

interface Resource {
  id: string;
  name: string;
  type: 'Team' | 'Tools' | 'Documentation' | 'Training';
  description: string;
  owner: string;
  status: 'Active' | 'Inactive' | 'Planned';
  createdAt: string;
  updatedAt: string;
}

interface ESAUser {
  id: string;
  firstName: string;
  lastName: string;
  appId: string;
  createdAt: string;
}

export const ESAResources = () => {
  const [users, setUsers] = useState<ESAUser[]>(() => {
    try {
      const stored = localStorage.getItem('esa-users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persistUsers = (next: ESAUser[]) => {
    setUsers(next);
    localStorage.setItem('esa-users', JSON.stringify(next));
  };

  const [newUser, setNewUser] = useState({ firstName: '', lastName: '' });

  const generateAppId = () => {
    return `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const handleCreateUser = () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      alert('First Name and Last Name are required');
      return;
    }

    let appId = generateAppId();
    const existingAppIds = new Set(users.map((u) => u.appId));
    while (existingAppIds.has(appId)) {
      appId = generateAppId();
    }

    const created: ESAUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      firstName: newUser.firstName.trim(),
      lastName: newUser.lastName.trim(),
      appId,
      createdAt: new Date().toISOString(),
    };

    persistUsers([...users, created]);
    setNewUser({ firstName: '', lastName: '' });
  };
  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      name: 'ESA Engineering Team',
      type: 'Team',
      description: 'Core engineering team for ESA implementations',
      owner: 'Team Lead',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Dynatrace Configuration Tools',
      type: 'Tools',
      description: 'Tools for configuring and managing Dynatrace monitoring',
      owner: 'Admin',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Implementation Guidelines',
      type: 'Documentation',
      description: 'Step-by-step guide for ESA implementations',
      owner: 'Documentation Team',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Advanced Monitoring Training',
      type: 'Training',
      description: 'Training program for advanced monitoring techniques',
      owner: 'Training Manager',
      status: 'Planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    type: 'Team',
    description: '',
    owner: '',
    status: 'Active',
  });

  const handleAddResource = () => {
    if (!formData.name || !formData.owner) {
      alert('Please fill in all required fields');
      return;
    }

    const newResource: Resource = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setResources([...resources, newResource]);
    setFormData({ name: '', type: 'Team', description: '', owner: '', status: 'Active' });
    setIsModalOpen(false);
  };

  const handleDeleteResource = (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter((r) => r.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Team':
        return <GroupIcon />;
      case 'Tools':
        return <SettingIcon />;
      case 'Documentation':
        return <DocumentStackIcon />;
      case 'Training':
        return <EducationIcon />;
      default:
        return <SettingIcon />;
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Heading level={1} style={{ marginBottom: '8px' }}>
            ESA Resources
          </Heading>
          <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>
            Manage teams, tools, documentation, and training materials
          </Paragraph>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Resource</Button>
      </div>

      {/* User creation panel */}
      <Surface
        elevation="flat"
        style={{
          marginBottom: '32px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <Heading level={3} style={{ margin: 0 }}>Create Users</Heading>
          <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>APPID is auto-generated and unique</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>First Name *</label>
            <TextInput
              value={newUser.firstName}
              onChange={(value) => setNewUser({ ...newUser, firstName: value })}
              placeholder="First name"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Last Name *</label>
            <TextInput
              value={newUser.lastName}
              onChange={(value) => setNewUser({ ...newUser, lastName: value })}
              placeholder="Last name"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>APPID (auto)</label>
            <TextInput
              value={newUser.firstName || newUser.lastName ? 'Will be generated' : ''}
              placeholder="Will be generated"
              readOnly
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="default" onClick={() => setNewUser({ firstName: '', lastName: '' })}>Clear</Button>
          <Button onClick={handleCreateUser}>Create User</Button>
        </div>

        {/* Users list */}
        <div style={{ marginTop: '16px' }}>
          <Heading level={4} style={{ marginBottom: '8px' }}>Configured Users</Heading>
          {users.length === 0 ? (
            <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>No users configured yet.</Paragraph>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                    <th style={{ padding: '8px 6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>First Name</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Last Name</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>APPID</th>
                    <th style={{ padding: '8px 6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                      <td style={{ padding: '10px 6px', fontSize: '13px' }}>{u.firstName}</td>
                      <td style={{ padding: '10px 6px', fontSize: '13px' }}>{u.lastName}</td>
                      <td style={{ padding: '10px 6px', fontSize: '13px', fontFamily: 'monospace' }}>{u.appId}</td>
                      <td style={{ padding: '10px 6px', fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Surface>

      {resources.length === 0 ? (
        <Surface
          elevation="flat"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
          }}
        >
          <Heading level={3}>No resources yet</Heading>
          <Paragraph style={{ color: 'var(--dt-colors-text-secondary)', marginBottom: '24px' }}>
            Start by adding your first ESA resource
          </Paragraph>
          <Button onClick={() => setIsModalOpen(true)}>Create First Resource</Button>
        </Surface>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {resources.map((resource) => (
            <Surface
              key={resource.id}
              elevation="flat"
              style={{
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span aria-hidden="true">{getTypeIcon(resource.type)}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{resource.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                      {resource.type}
                    </div>
                  </div>
                </div>
                <Chip color={resource.status === 'Active' ? 'success' : resource.status === 'Planned' ? 'primary' : 'neutral'}>{resource.status}</Chip>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Paragraph style={{ margin: 0, fontSize: '13px', color: 'var(--dt-colors-text-primary)' }}>
                  {resource.description}
                </Paragraph>
              </div>

              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>Owner</div>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{resource.owner}</div>
              </div>

              <Button width="full" color="critical" onClick={() => handleDeleteResource(resource.id)}>
                Delete
              </Button>
            </Surface>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal show title="Add New Resource" onDismiss={() => setIsModalOpen(false)}>
          <div
            style={{
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Resource Name *
                </label>
                <TextInput
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  placeholder="e.g., ESA Engineering Team"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Type
                </label>
                <Select
                  aria-label="Resource type"
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value as Resource['type'] })}
                  style={{ width: '100%' }}
                >
                  <Select.Content>
                    <Select.Option value="Team">Team</Select.Option>
                    <Select.Option value="Tools">Tools</Select.Option>
                    <Select.Option value="Documentation">Documentation</Select.Option>
                    <Select.Option value="Training">Training</Select.Option>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <TextArea
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Describe this resource..."
                  rows={3}
                  resize="vertical"
                  width="full"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Owner *
                </label>
                <TextInput
                  value={formData.owner}
                  onChange={(value) => setFormData({ ...formData, owner: value })}
                  placeholder="Name or title of resource owner"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Status
                </label>
                <Select
                  aria-label="Resource status"
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as Resource['status'] })}
                  style={{ width: '100%' }}
                >
                  <Select.Content>
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="Inactive">Inactive</Select.Option>
                    <Select.Option value="Planned">Planned</Select.Option>
                  </Select.Content>
                </Select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button variant="default" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddResource}>Add Resource</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
