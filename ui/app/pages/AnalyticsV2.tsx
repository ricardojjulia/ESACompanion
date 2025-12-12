import React, { useEffect, useState } from 'react';
import { Heading } from '@dynatrace/strato-components/typography';

interface ClientMetrics {
  clientId: string;
  clientName: string;
  totalEngagements: number;
  totalInteractions: number;
  totalTasks: number;
  completedTasks: number;
  stalledTasks: number;
  cancelledInteractions: number;
  lastInteractionDate?: string;
  healthScore: number;
  redFlags: string[];
  engagementMomentum: 'high' | 'medium' | 'low';
  interactionCadence: 'frequent' | 'moderate' | 'sparse';
}

export const AnalyticsV2 = () => {
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics[]>([]);
  const [sortBy, setSortBy] = useState<'health' | 'momentum' | 'interactions'>('health');

  useEffect(() => {
    calculateClientHealthScores();
    const interval = setInterval(calculateClientHealthScores, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateClientHealthScores = () => {
    try {
      const engagements = JSON.parse(localStorage.getItem('esa-engagements') || '[]');
      const interactions = JSON.parse(localStorage.getItem('esa-client-interactions') || '[]');
      const clientsData = JSON.parse(localStorage.getItem('esa-clients') || '{}');
      
      // Convert clients object to array (handle both object and array formats)
      let clientsArray: any[] = [];
      if (Array.isArray(clientsData)) {
        clientsArray = clientsData;
      } else if (typeof clientsData === 'object' && clientsData !== null) {
        clientsArray = Object.values(clientsData);
      }

      const metrics: ClientMetrics[] = clientsArray.map((client: any) => {
        // Count engagements for this client
        const clientEngagements = engagements.filter((e: any) => e.clientName === client.name);
        const totalEngagements = clientEngagements.length;

        // Count and analyze tasks
        let totalTasks = 0;
        let completedTasks = 0;
        let stalledTasks = 0;
        clientEngagements.forEach((eng: any) => {
          (eng.tasks || []).forEach((task: any) => {
            totalTasks++;
            if (task.status === 'Delivered' || task.status === 'Finished') completedTasks++;
            if (task.status === 'Stalled') stalledTasks++;
          });
        });

        // Count interactions for this client
        const clientInteractions = interactions.filter((i: any) => i.clientName === client.name);
        const totalInteractions = clientInteractions.length;
        const cancelledInteractions = clientInteractions.filter((i: any) => i.status === 'Cancelled').length;

        // Find last interaction date
        let lastInteractionDate: string | undefined;
        if (clientInteractions.length > 0) {
          const dates = clientInteractions
            .map((i: any) => new Date(i.date || i.createdAt || 0).getTime())
            .filter((d: any) => !isNaN(d));
          if (dates.length > 0) {
            lastInteractionDate = new Date(Math.max(...dates)).toISOString();
          }
        }

        // Calculate health score (0-100)
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50;
        const engagementActivity = Math.min(totalEngagements * 20, 30);
        const interactionFrequency = Math.min(totalInteractions * 5, 30);
        const stalledPenalty = Math.max(0, 10 - stalledTasks * 2);
        const cancelledPenalty = Math.max(0, 10 - cancelledInteractions * 3);

        const healthScore = Math.round(
          (taskCompletionRate * 0.4 + engagementActivity + interactionFrequency + stalledPenalty + cancelledPenalty) / 1.3
        );

        // Determine engagement momentum
        const recentEngagements = clientEngagements.filter((e: any) => {
          const createdAt = new Date(e.createdAt || 0);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return createdAt > thirtyDaysAgo;
        }).length;
        const engagementMomentum: 'high' | 'medium' | 'low' =
          recentEngagements >= 2 ? 'high' : recentEngagements === 1 ? 'medium' : 'low';

        // Determine interaction cadence
        let interactionCadence: 'frequent' | 'moderate' | 'sparse' = 'sparse';
        if (totalInteractions > 0 && lastInteractionDate) {
          const daysSinceLastInteraction =
            (Date.now() - new Date(lastInteractionDate).getTime()) / (24 * 60 * 60 * 1000);
          if (daysSinceLastInteraction < 7) {
            interactionCadence = 'frequent';
          } else if (daysSinceLastInteraction < 30) {
            interactionCadence = 'moderate';
          }
        }

        // Identify red flags
        const redFlags: string[] = [];
        if (stalledTasks > 0) redFlags.push(`${stalledTasks} stalled task${stalledTasks > 1 ? 's' : ''}`);
        if (cancelledInteractions > 0) redFlags.push(`${cancelledInteractions} cancelled interaction${cancelledInteractions > 1 ? 's' : ''}`);
        if (lastInteractionDate && (Date.now() - new Date(lastInteractionDate).getTime()) > 60 * 24 * 60 * 60 * 1000) {
          redFlags.push('No interaction in 60+ days');
        }
        if (totalEngagements === 0) redFlags.push('No active engagements');
        if (totalTasks > 0 && taskCompletionRate < 30) redFlags.push('Low task completion rate');

        return {
          clientId: client.id,
          clientName: client.name,
          totalEngagements,
          totalInteractions,
          totalTasks,
          completedTasks,
          stalledTasks,
          cancelledInteractions,
          lastInteractionDate,
          healthScore: Math.max(0, Math.min(100, healthScore)),
          redFlags,
          engagementMomentum,
          interactionCadence,
        };
      });

      setClientMetrics(metrics);
    } catch (error) {
      console.error('Error calculating health scores:', error);
    }
  };

  const getSortedMetrics = () => {
    const sorted = [...clientMetrics];
    switch (sortBy) {
      case 'health':
        return sorted.sort((a, b) => b.healthScore - a.healthScore);
      case 'momentum':
        const momentumOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => momentumOrder[b.engagementMomentum] - momentumOrder[a.engagementMomentum]);
      case 'interactions':
        return sorted.sort((a, b) => b.totalInteractions - a.totalInteractions);
      default:
        return sorted;
    }
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#ef5350'; // light red
    return '#d32f2f'; // dark red
  };

  const getMomentumEmoji = (momentum: string): string => {
    return momentum === 'high' ? '📈' : momentum === 'medium' ? '→' : '📉';
  };

  const getCadenceEmoji = (cadence: string): string => {
    return cadence === 'frequent' ? '⚡' : cadence === 'moderate' ? '🔔' : '⏱️';
  };

  const sortedMetrics = getSortedMetrics();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Heading level={1} style={{ marginBottom: '8px' }}>
        ESA Companion Analytics V2.0
      </Heading>
      <div style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Client Health Scorecard — Real-time vitality, momentum, and risk indicators
      </div>

      {/* Sort Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setSortBy('health')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: sortBy === 'health' ? '2px solid #2196f3' : '1px solid #ddd',
            backgroundColor: sortBy === 'health' ? '#e3f2fd' : '#fff',
            cursor: 'pointer',
            fontWeight: sortBy === 'health' ? 'bold' : 'normal',
          }}
        >
          💚 Health Score
        </button>
        <button
          onClick={() => setSortBy('momentum')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: sortBy === 'momentum' ? '2px solid #2196f3' : '1px solid #ddd',
            backgroundColor: sortBy === 'momentum' ? '#e3f2fd' : '#fff',
            cursor: 'pointer',
            fontWeight: sortBy === 'momentum' ? 'bold' : 'normal',
          }}
        >
          📈 Momentum
        </button>
        <button
          onClick={() => setSortBy('interactions')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: sortBy === 'interactions' ? '2px solid #2196f3' : '1px solid #ddd',
            backgroundColor: sortBy === 'interactions' ? '#e3f2fd' : '#fff',
            cursor: 'pointer',
            fontWeight: sortBy === 'interactions' ? 'bold' : 'normal',
          }}
        >
          📞 Interactions
        </button>
      </div>

      {/* Metrics Grid */}
      {clientMetrics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No clients yet. Create a client in Client Management to get started.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedMetrics.map((metric) => (
            <div
              key={metric.clientId}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Red flag indicator strip */}
              {metric.redFlags.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: metric.healthScore >= 60 ? '#ff9800' : '#d32f2f',
                  }}
                />
              )}

              {/* Client Name & ID */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                  {metric.clientName}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>ID: {metric.clientId}</div>
              </div>

              {/* Health Score Gauge */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Health Score</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: getHealthColor(metric.healthScore) }}>
                    {metric.healthScore}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${metric.healthScore}%`,
                      height: '100%',
                      backgroundColor: getHealthColor(metric.healthScore),
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Momentum & Cadence Pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '2px' }}>{getMomentumEmoji(metric.engagementMomentum)}</div>
                  <div style={{ color: '#666' }}>Momentum</div>
                  <div style={{ fontWeight: 'bold', color: '#000', marginTop: '2px' }}>
                    {metric.engagementMomentum.charAt(0).toUpperCase() + metric.engagementMomentum.slice(1)}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '2px' }}>{getCadenceEmoji(metric.interactionCadence)}</div>
                  <div style={{ color: '#666' }}>Cadence</div>
                  <div style={{ fontWeight: 'bold', color: '#000', marginTop: '2px' }}>
                    {metric.interactionCadence.charAt(0).toUpperCase() + metric.interactionCadence.slice(1)}
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#999' }}>Engagements</div>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: '16px' }}>
                    {metric.totalEngagements}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#999' }}>Interactions</div>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: '16px' }}>
                    {metric.totalInteractions}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#999' }}>Tasks Complete</div>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: '16px' }}>
                    {metric.completedTasks}/{metric.totalTasks}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#999' }}>Completion %</div>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: '16px' }}>
                    {metric.totalTasks > 0 ? Math.round((metric.completedTasks / metric.totalTasks) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {metric.redFlags.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '6px' }}>
                    🚩 RED FLAGS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {metric.redFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '12px',
                          color: '#d32f2f',
                          padding: '4px 8px',
                          backgroundColor: '#ffebee',
                          borderRadius: '4px',
                          border: '1px solid #ffcdd2',
                        }}
                      >
                        ⚠️ {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Interaction Date */}
              {metric.lastInteractionDate && (
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#999', textAlign: 'center' }}>
                  Last activity: {new Date(metric.lastInteractionDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
