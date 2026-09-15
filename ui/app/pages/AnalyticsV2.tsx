import React, { useEffect, useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import { EmptyState } from '@dynatrace/strato-components-preview/content';
import { isClientInteractionVisibleToUser, isEngagementVisibleToUser } from '../utils/partitionedCollection';
import { getVisibleClients, parseClientRegistry } from '../utils/clientRegistry';

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

export const AnalyticsV2 = ({ userAppId, isManager }: { userAppId: string | null; isManager: boolean }) => {
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics[]>([]);
  const [sortBy, setSortBy] = useState<'health' | 'momentum' | 'interactions'>('health');

  useEffect(() => {
    calculateClientHealthScores();
    const interval = setInterval(calculateClientHealthScores, 5000);
    return () => clearInterval(interval);
  }, [userAppId, isManager]);

  const calculateClientHealthScores = () => {
    try {
      const storedEngagements: unknown = JSON.parse(localStorage.getItem('esa-engagements') || '[]');
      const storedInteractions: unknown = JSON.parse(localStorage.getItem('esa-client-interactions') || '[]');
      const engagements = Array.isArray(storedEngagements)
        ? storedEngagements.filter((engagement: any) => isEngagementVisibleToUser(engagement, userAppId, isManager))
        : [];
      const interactions = Array.isArray(storedInteractions)
        ? storedInteractions.filter((interaction: any) => isClientInteractionVisibleToUser(interaction, engagements, userAppId, isManager))
        : [];
      const clientsArray = isManager
        ? getVisibleClients(parseClientRegistry(localStorage.getItem('esa-clients')), userAppId, isManager)
        : Array.from(new Map(engagements.map((engagement: any) => [engagement.clientName, { id: engagement.clientName, name: engagement.clientName }])).values());

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
    if (score >= 80) return 'var(--dt-colors-text-success)';
    if (score >= 60) return 'var(--dt-colors-text-warning)';
    return 'var(--dt-colors-text-critical)';
  };

  const getMomentumLabel = (momentum: string): string => {
    return momentum === 'high' ? 'Increasing' : momentum === 'medium' ? 'Steady' : 'Decreasing';
  };

  const getCadenceLabel = (cadence: string): string => {
    return cadence === 'frequent' ? 'Frequent' : cadence === 'moderate' ? 'Moderate' : 'Sparse';
  };

  const sortedMetrics = getSortedMetrics();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Heading level={1} style={{ marginBottom: '8px' }}>
        ESA Companion Analytics V2.0
      </Heading>
      <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Client Health Scorecard: real-time vitality, momentum, and risk indicators
      </div>

      {/* Sort Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Button variant={sortBy === 'health' ? 'emphasized' : 'default'} onClick={() => setSortBy('health')}>Health Score</Button>
        <Button variant={sortBy === 'momentum' ? 'emphasized' : 'default'} onClick={() => setSortBy('momentum')}>Momentum</Button>
        <Button variant={sortBy === 'interactions' ? 'emphasized' : 'default'} onClick={() => setSortBy('interactions')}>Interactions</Button>
      </div>

      {/* Metrics Grid */}
      {clientMetrics.length === 0 ? (
        <EmptyState><EmptyState.Title>No clients yet</EmptyState.Title><EmptyState.Details>Create a client in Client Management to get started.</EmptyState.Details></EmptyState>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '16px',
          }}
        >
          {sortedMetrics.map((metric) => (
            <Surface
              key={metric.clientId}
              elevation="flat"
              color={metric.redFlags.length > 0 ? 'warning' : 'neutral'}
              style={{
                padding: '16px',
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
                    backgroundColor: metric.healthScore >= 60 ? 'var(--dt-colors-background-warning-default)' : 'var(--dt-colors-background-critical-default)',
                  }}
                />
              )}

              {/* Client Name & ID */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {metric.clientName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>ID: {metric.clientId}</div>
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
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--dt-colors-text-secondary)' }}>Health Score</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: getHealthColor(metric.healthScore) }}>
                    {metric.healthScore}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--dt-colors-surface-container-subtle)',
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
                    backgroundColor: 'var(--dt-colors-surface-container-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Momentum</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
                    {getMomentumLabel(metric.engagementMomentum)}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: 'var(--dt-colors-surface-container-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Cadence</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
                    {getCadenceLabel(metric.interactionCadence)}
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
                <div style={{ backgroundColor: 'var(--dt-colors-surface-container-subtle)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Engagements</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {metric.totalEngagements}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--dt-colors-surface-container-subtle)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Interactions</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {metric.totalInteractions}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--dt-colors-surface-container-subtle)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Tasks Complete</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {metric.completedTasks}/{metric.totalTasks}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--dt-colors-surface-container-subtle)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--dt-colors-text-secondary)' }}>Completion %</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {metric.totalTasks > 0 ? Math.round((metric.completedTasks / metric.totalTasks) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {metric.redFlags.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--dt-colors-border-container-default)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--dt-colors-text-critical)', marginBottom: '6px' }}>
                    Red flags
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {metric.redFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '12px',
                          color: 'var(--dt-colors-text-critical)',
                          padding: '4px 8px',
                          backgroundColor: 'var(--dt-colors-surface-critical-subtle)',
                          borderRadius: '4px',
                          border: '1px solid var(--dt-colors-border-critical-default)',
                        }}
                      >
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Interaction Date */}
              {metric.lastInteractionDate && (
                <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--dt-colors-text-secondary)', textAlign: 'center' }}>
                  Last activity: {new Date(metric.lastInteractionDate).toLocaleDateString()}
                </div>
              )}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};
