import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';

interface ESAUser {
  id: string;
  firstName: string;
  lastName: string;
  appId: string;
  createdAt: string;
}

interface UserMetrics {
  appId: string;
  firstName: string;
  lastName: string;
  totalEngagements: number;
  totalTasks: number;
  tasksNotStarted: number;
  tasksInProgress: number;
  tasksStalled: number;
  tasksFinished: number;
  tasksClosed: number;
  completionRate: number;
  totalInteractions: number;
}

export const Reports = () => {
  const [users, setUsers] = useState<ESAUser[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>([]);
  const [selectedUserAppId, setSelectedUserAppId] = useState<string | null>(null);

  useEffect(() => {
    loadUsersAndMetrics();
  }, []);

  const loadUsersAndMetrics = () => {
    // Load configured users
    const storedUsers = localStorage.getItem('esa-users');
    const parsedUsers: ESAUser[] = storedUsers ? JSON.parse(storedUsers) : [];
    setUsers(parsedUsers);

    // Load engagements and interactions
    const storedEngagements = localStorage.getItem('esa-engagements');
    const storedInteractions = localStorage.getItem('esa-client-interactions');
    
    const engagements: any[] = storedEngagements ? JSON.parse(storedEngagements) : [];
    const interactions: any[] = storedInteractions ? JSON.parse(storedInteractions) : [];

    // Calculate metrics per user
    const metrics: UserMetrics[] = parsedUsers.map((user) => {
      const userEngagements = engagements.filter((e) => e.appId === user.appId);
      const userInteractions = interactions.filter((i) => i.appId === user.appId);

      let totalTasks = 0;
      let tasksNotStarted = 0;
      let tasksInProgress = 0;
      let tasksStalled = 0;
      let tasksFinished = 0;
      let tasksClosed = 0;

      userEngagements.forEach((engagement) => {
        const tasks = engagement.tasks || [];
        totalTasks += tasks.length;

        tasks.forEach((task: any) => {
          switch (task.status) {
            case 'Not Started':
              tasksNotStarted++;
              break;
            case 'In Progress':
              tasksInProgress++;
              break;
            case 'Stalled':
              tasksStalled++;
              break;
            case 'Finished':
              tasksFinished++;
              break;
            case 'Delivered':
              tasksClosed++;
              break;
          }
        });
      });

      const completionRate = totalTasks > 0 ? Math.round(((tasksClosed + tasksFinished) / totalTasks) * 100) : 0;

      return {
        appId: user.appId,
        firstName: user.firstName,
        lastName: user.lastName,
        totalEngagements: userEngagements.length,
        totalTasks,
        tasksNotStarted,
        tasksInProgress,
        tasksStalled,
        tasksFinished,
        tasksClosed,
        completionRate,
        totalInteractions: userInteractions.length,
      };
    });

    setUserMetrics(metrics);
    if (metrics.length > 0) {
      setSelectedUserAppId(metrics[0].appId);
    }
  };

  const selectedMetrics = userMetrics.find((m) => m.appId === selectedUserAppId);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Heading level={1} style={{ marginBottom: '8px' }}>
          Team Reports
        </Heading>
        <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>
          User performance and engagement analytics
        </Paragraph>
      </div>

      {users.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            backgroundColor: 'var(--dt-colors-surface-container-default)',
            borderRadius: '8px',
            border: '1px solid var(--dt-colors-border-container-default)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <Heading level={3}>No users configured yet</Heading>
          <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>
            Create users in ESA Resources to see their analytics here.
          </Paragraph>
        </div>
      ) : (
        <>
          {/* User Selection Tabs */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {userMetrics.map((metric) => (
              <button
                key={metric.appId}
                onClick={() => setSelectedUserAppId(metric.appId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--dt-colors-border-container-default)',
                  backgroundColor: selectedUserAppId === metric.appId ? 'var(--dt-colors-surface-selected)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedUserAppId === metric.appId ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {metric.firstName} {metric.lastName}
              </button>
            ))}
          </div>

          {selectedMetrics && (
            <>
              {/* User Header */}
              <div
                style={{
                  marginBottom: '32px',
                  padding: '24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Heading level={2} style={{ margin: 0, marginBottom: '8px', color: '#ffffff' }}>
                  {selectedMetrics.firstName} {selectedMetrics.lastName}
                </Heading>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  APPID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedMetrics.appId}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '32px',
                }}
              >
                {/* Total Engagements */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.totalEngagements}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Total Engagements
                  </div>
                </div>

                {/* Tasks In Progress */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.tasksInProgress}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Tasks In Progress
                  </div>
                </div>

                {/* Tasks Closed */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.tasksClosed}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Tasks Closed
                  </div>
                </div>

                {/* Not Started */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏸️</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.tasksNotStarted}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Not Started
                  </div>
                </div>

                {/* Stalled */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.tasksStalled}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Stalled
                  </div>
                </div>

                {/* Finished */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                    {selectedMetrics.tasksFinished}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    Finished
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Total Tasks */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Total Tasks
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
                    {selectedMetrics.totalTasks}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
                    All tasks across engagements
                  </div>
                </div>

                {/* Completion Rate */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Completion Rate
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', color: selectedMetrics.completionRate > 75 ? '#4caf50' : '#ff9800' }}>
                    {selectedMetrics.completionRate}%
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
                    Finished + Closed / Total
                  </div>
                </div>

                {/* Active Work */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Active Work
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
                    {selectedMetrics.tasksInProgress}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
                    Tasks in progress
                  </div>
                </div>

                {/* Needs Attention */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Needs Attention
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', color: selectedMetrics.tasksStalled > 0 ? '#ff6666' : '#4caf50' }}>
                    {selectedMetrics.tasksStalled + selectedMetrics.tasksNotStarted}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
                    Stalled + Not Started
                  </div>
                </div>

                {/* Total Interactions */}
                <div
                  style={{
                    backgroundColor: 'var(--dt-colors-surface-container-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Total Interactions
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>
                    {selectedMetrics.totalInteractions}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dt-colors-text-secondary)' }}>
                    Client interactions
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
