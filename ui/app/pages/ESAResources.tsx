import React, { useState } from 'react';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';

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
        return '👥';
      case 'Tools':
        return '🔧';
      case 'Documentation':
        return '📚';
      case 'Training':
        return '🎓';
      default:
        return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4caf50';
      case 'Inactive':
        return '#757575';
      case 'Planned':
        return '#2196f3';
      default:
        return '#757575';
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
        <Button onClick={() => setIsModalOpen(true)}>+ Add Resource</Button>
      </div>

      {/* User creation panel */}
      <div
        style={{
          marginBottom: '32px',
          padding: '20px',
          border: '1px solid var(--dt-colors-border-container-default)',
          borderRadius: '10px',
          backgroundColor: 'var(--dt-colors-surface-container-default)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <Heading level={3} style={{ margin: 0 }}>Create Users</Heading>
          <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>APPID is auto-generated and unique</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>First Name *</label>
            <input
              type="text"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              placeholder="First name"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Last Name *</label>
            <input
              type="text"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              placeholder="Last name"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>APPID (auto)</label>
            <input
              type="text"
              value={newUser.firstName || newUser.lastName ? 'Will be generated' : ''}
              placeholder="Will be generated"
              readOnly
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'var(--dt-colors-surface-raised)' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setNewUser({ firstName: '', lastName: '' })}>Clear</Button>
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
      </div>

      {resources.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            backgroundColor: 'var(--dt-colors-surface-container-default)',
            borderRadius: '8px',
            border: '1px solid var(--dt-colors-border-container-default)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <Heading level={3}>No resources yet</Heading>
          <Paragraph style={{ color: 'var(--dt-colors-text-secondary)', marginBottom: '24px' }}>
            Start by adding your first ESA resource
          </Paragraph>
          <Button onClick={() => setIsModalOpen(true)}>Create First Resource</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {resources.map((resource) => (
            <div
              key={resource.id}
              style={{
                backgroundColor: 'var(--dt-colors-surface-container-default)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '8px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{getTypeIcon(resource.type)}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{resource.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                      {resource.type}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: `${getStatusColor(resource.status)}20`,
                    color: getStatusColor(resource.status),
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {resource.status}
                </div>
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

              <button
                onClick={() => handleDeleteResource(resource.id)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#d32f2f',
                  border: '1px solid #d32f2f',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '12px',
              width: '600px',
              maxWidth: '90vw',
              border: '3px solid #2196f3',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Add New Resource</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Resource Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ESA Engineering Team"
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Team">Team</option>
                  <option value="Tools">Tools</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Training">Training</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this resource..."
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Owner *
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Name or title of resource owner"
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

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Resource['status'] })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
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
                  onClick={handleAddResource}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#2196f3',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Add Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
