import React, { useEffect, useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import { RefreshIcon, TargetFilledIcon, WarningIcon } from '@dynatrace/strato-icons';
import type { ClientInteraction } from '../types/client';
import type { Engagement, Objective, Task } from './Engagements';
import { isClientInteractionVisibleToUser, isEngagementVisibleToUser } from '../utils/partitionedCollection';

interface HomeProps {
  onLogout?: () => void;
  isManager?: boolean;
  userAppId: string | null;
}

interface ObjectiveProgress {
  objective: Objective;
  engagementName: string;
  assignedTasks: Task[];
}

const isUnfinished = (task: Task) => task.status !== 'Delivered';

export const Home = ({ onLogout, isManager = false, userAppId }: HomeProps) => {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);

  const loadWorkspace = () => {
    try {
      const storedEngagements = JSON.parse(localStorage.getItem('esa-engagements') || '[]');
      const storedInteractions = JSON.parse(localStorage.getItem('esa-client-interactions') || '[]');
      const visibleEngagements = Array.isArray(storedEngagements)
        ? storedEngagements.filter((engagement: Engagement) => isEngagementVisibleToUser(engagement, userAppId, isManager))
        : [];
      setEngagements(visibleEngagements);
      setInteractions(Array.isArray(storedInteractions)
        ? storedInteractions.filter((interaction: ClientInteraction) => isClientInteractionVisibleToUser(interaction, visibleEngagements, userAppId, isManager))
        : []);
    } catch (error) {
      console.error('Failed to load Architect workspace:', error);
      setEngagements([]);
      setInteractions([]);
    }
  };

  useEffect(() => {
    loadWorkspace();
    const refresh = (event: StorageEvent) => {
      if (event.key === 'esa-engagements' || event.key === 'esa-client-interactions') loadWorkspace();
    };
    const refreshWhenVisible = () => {
      if (!document.hidden) loadWorkspace();
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', loadWorkspace);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', loadWorkspace);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [isManager, userAppId]);

  const objectiveProgress: ObjectiveProgress[] = engagements.flatMap((engagement) =>
    (engagement.objectives ?? []).map((objective) => ({
      objective,
      engagementName: engagement.name,
      assignedTasks: engagement.tasks.filter((task) => task.objectiveId === objective.id),
    })),
  );
  const allTasks = engagements.flatMap((engagement) => engagement.tasks.map((task) => ({ ...task, engagementName: engagement.name })));
  const attentionTasks = allTasks.filter((task) => {
    const overdue = task.dueDate && new Date(task.dueDate) < new Date();
    return isUnfinished(task) && (task.status === 'Stalled' || overdue);
  });
  const latestLinkedInteraction = interactions
    .filter((interaction) => interaction.engagementId && engagements.some((engagement) => engagement.id === interaction.engagementId))
    .sort((left, right) => new Date(right.date || right.createdAt).getTime() - new Date(left.date || left.createdAt).getTime())[0];

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <Heading level={1} style={{ marginBottom: '4px' }}>Architect Workspace</Heading>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px', margin: 0 }}>Objectives, delivery progress, and client signals across accessible engagements.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button onClick={loadWorkspace}><Button.Prefix><RefreshIcon /></Button.Prefix>Refresh</Button>
          {onLogout && <Button color="critical" onClick={onLogout}>Logout</Button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Surface elevation="flat" style={{ padding: '20px', borderTop: `4px solid ${Colors.Icon.Primary.Default}` }}>
          <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px' }}>Objectives</div>
          <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px' }}>{objectiveProgress.length}</div>
          <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', marginTop: '4px' }}>Across {engagements.length} accessible engagements</div>
        </Surface>
        <Surface elevation="flat" style={{ padding: '20px', borderTop: `4px solid ${Colors.Icon.Warning.Default}` }}>
          <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px' }}>Tasks needing attention</div>
          <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px' }}>{attentionTasks.length}</div>
          <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', marginTop: '4px' }}>Stalled or overdue unfinished tasks</div>
        </Surface>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '24px' }}>
        <Surface elevation="flat" style={{ padding: '20px' }}>
          <Heading level={2} style={{ marginBottom: '16px' }}><TargetFilledIcon /> Objective progress</Heading>
          {objectiveProgress.length === 0 ? <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0 }}>No objectives have been created in accessible engagements.</p> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {objectiveProgress.map(({ objective, engagementName, assignedTasks }) => {
                const delivered = assignedTasks.filter((task) => task.status === 'Delivered').length;
                const percent = assignedTasks.length ? Math.round((delivered / assignedTasks.length) * 100) : 0;
                return <div key={objective.id} style={{ borderBottom: '1px solid var(--dt-colors-border-container-default)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><strong>{objective.title}</strong><span>{percent}%</span></div>
                  <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', margin: '4px 0 8px' }}>{engagementName} · {delivered}/{assignedTasks.length} delivered</div>
                  <div style={{ height: '6px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${percent}%`, backgroundColor: Colors.Background.Container.Success.Default }} /></div>
                </div>;
              })}
            </div>}
        </Surface>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Surface elevation="flat" style={{ padding: '20px' }}>
            <Heading level={2} style={{ marginBottom: '12px' }}><WarningIcon /> Needs attention</Heading>
            {attentionTasks.length === 0 ? <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0 }}>No stalled or overdue tasks.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{attentionTasks.slice(0, 5).map((task) => <div key={task.id}><strong>{task.title}</strong><div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px' }}>{task.engagementName} · {task.status}</div></div>)}</div>}
          </Surface>
          <Surface elevation="flat" style={{ padding: '20px' }}>
            <Heading level={2} style={{ marginBottom: '12px' }}>Latest client update</Heading>
            {latestLinkedInteraction ? <><strong>{latestLinkedInteraction.clientName}</strong><div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', marginTop: '4px' }}>{latestLinkedInteraction.interactionType} · {new Date(latestLinkedInteraction.date).toLocaleDateString()}</div><p style={{ marginBottom: 0, fontSize: '13px' }}>{latestLinkedInteraction.notes || 'No notes recorded.'}</p></> : <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0 }}>No linked client update in accessible engagements.</p>}
          </Surface>
        </div>
      </div>
    </div>
  );
};

