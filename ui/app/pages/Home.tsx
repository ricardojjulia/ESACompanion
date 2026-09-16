import React, { useEffect, useState } from 'react';
import { Button } from '@dynatrace/strato-components/buttons';
import { Surface } from '@dynatrace/strato-components/layouts';
import Colors from '@dynatrace/strato-design-tokens/colors';
import {
  AnalyticsIcon,
  RefreshIcon,
  TargetFilledIcon,
  WarningIcon,
} from '@dynatrace/strato-icons';
import type { Comment, Objective, Project } from '../types/project';

interface HomeProps {
  onLogout?: () => void;
  isManager?: boolean;
  userAppId: string | null;
}

const loadProjects = (): Project[] => {
  try {
    const stored = JSON.parse(localStorage.getItem('esa-engagements') || '[]');
    return Array.isArray(stored)
      ? stored.map((p: any) => ({
          ...p,
          tasks: (p.tasks ?? []).map((t: any) => ({
            ...t,
            comments: t.comments ?? (t.notes ?? []).map((n: any) => ({ ...n, role: 'Architect' as const })),
            subtasks: t.subtasks ?? [],
          })),
          milestones: p.milestones ?? [],
          objectives: p.objectives ?? [],
        }))
      : [];
  } catch {
    return [];
  }
};

// ── Shared components ─────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  urgent?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, sub, accent, urgent, icon: Icon }) => (
  <Surface
    elevation="flat"
    style={{
      padding: '20px',
      borderTop: `3px solid ${accent}`,
      position: 'relative',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dt-colors-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </div>
      {Icon && <Icon size={16} style={{ color: accent, opacity: 0.75 }} />}
    </div>
    <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1, marginBottom: '6px', color: urgent && Number(value) > 0 ? accent : 'var(--dt-colors-text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>{sub}</div>
  </Surface>
);

interface SectionCardProps {
  title: string;
  accent?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, accent = '#3b82f6', children }) => (
  <Surface elevation="flat" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '3px', height: '18px', backgroundColor: accent, borderRadius: '2px', flexShrink: 0 }} />
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dt-colors-text-primary)' }}>{title}</div>
    </div>
    {children}
  </Surface>
);

const ItemRow: React.FC<{ primary: string; secondary: string; accent?: string; tag?: React.ReactNode }> = ({
  primary, secondary, accent = '#64748b', tag,
}) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
    <div style={{ width: '3px', borderRadius: '2px', alignSelf: 'stretch', flexShrink: 0, backgroundColor: accent, marginTop: '2px' }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {primary}{tag}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)', marginTop: '2px' }}>{secondary}</div>
    </div>
  </div>
);

// ── Architect Home ────────────────────────────────────────────────────────────

const ArchitectHome: React.FC<{ projects: Project[]; onRefresh: () => void }> = ({ projects, onRefresh }) => {
  const allTasks = projects.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, projectName: p.name, clientName: p.clientName }))
  );
  const clientTasks = allTasks.filter(
    (t) => (t.owner === 'Client' || t.owner === 'Both') && t.status !== 'Delivered'
  );
  const awaitingSignOff = allTasks.filter(
    (t) => (t.status === 'Delivered' || t.status === 'Finished') && !t.acknowledgedAt
  );
  const stalledTasks = allTasks.filter((t) => t.status === 'Stalled');
  const newClientComments = allTasks
    .flatMap((t) =>
      (t.comments ?? [])
        .filter((c: Comment) => c.role === 'Client')
        .map((c) => ({ ...c, taskTitle: t.title, projectName: t.projectName }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalTasks = allTasks.length;
  const delivered = allTasks.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
  const overallPct = totalTasks > 0 ? Math.round((delivered / totalTasks) * 100) : 0;

  const objectiveProgress = projects.flatMap((p) =>
    (p.objectives ?? []).map((obj: Objective) => ({
      objective: obj,
      projectName: p.name,
      assigned: p.tasks.filter((t) => t.objectiveId === obj.id),
    }))
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Architect Workspace
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Project Health Overview</h1>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px', margin: '6px 0 0' }}>
            Client signals, blockers, and engagement status at a glance.
          </p>
        </div>
        <Button onClick={onRefresh} style={{ flexShrink: 0 }}>
          <Button.Prefix><RefreshIcon /></Button.Prefix>Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatTile label="Projects" value={projects.length} sub="Total active" accent="#3b82f6" icon={AnalyticsIcon} />
        <StatTile label="Overall Progress" value={`${overallPct}%`} sub={`${delivered} / ${totalTasks} tasks complete`} accent="#6366f1" />
        <StatTile
          label="Waiting on Client" value={clientTasks.length} sub="Client-owned open tasks"
          accent={clientTasks.length > 0 ? '#f59e0b' : '#6366f1'} urgent={clientTasks.length > 0}
        />
        <StatTile
          label="Awaiting Sign-off" value={awaitingSignOff.length} sub="Delivered, not acknowledged"
          accent={awaitingSignOff.length > 0 ? '#f59e0b' : '#6366f1'} urgent={awaitingSignOff.length > 0}
        />
        <StatTile
          label="Stalled" value={stalledTasks.length} sub="Need intervention"
          accent={stalledTasks.length > 0 ? '#ef4444' : '#6366f1'} urgent={stalledTasks.length > 0}
          icon={stalledTasks.length > 0 ? WarningIcon : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Waiting on client */}
        <SectionCard title="Waiting on Client" accent="#f59e0b">
          {clientTasks.length === 0 ? (
            <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>No open client-owned tasks.</p>
          ) : (
            clientTasks.slice(0, 6).map((t) => (
              <ItemRow
                key={t.id}
                primary={t.title}
                secondary={`${t.projectName} · ${t.status}${t.dueDate && new Date(t.dueDate) < new Date() ? ' · ⚠ Overdue' : ''}`}
                accent="#f59e0b"
              />
            ))
          )}
        </SectionCard>

        {/* Awaiting sign-off */}
        <SectionCard title="Awaiting Client Sign-off" accent="#10b981">
          {awaitingSignOff.length === 0 ? (
            <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>All delivered items are acknowledged.</p>
          ) : (
            awaitingSignOff.slice(0, 6).map((t) => (
              <ItemRow
                key={t.id}
                primary={t.title}
                secondary={`${t.projectName} · ${t.status}`}
                accent="#10b981"
              />
            ))
          )}
        </SectionCard>

        {/* New client comments */}
        <SectionCard title="Recent Client Comments" accent="#8b5cf6">
          {newClientComments.length === 0 ? (
            <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>No client comments yet.</p>
          ) : (
            newClientComments.map((c) => (
              <div key={c.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                <div style={{ fontSize: '13px', marginBottom: '3px', fontStyle: 'italic' }}>"{c.text}"</div>
                <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>
                  {c.taskTitle} · {c.projectName} · {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </SectionCard>

        {/* Objective progress */}
        <SectionCard title="Objective Progress" accent="#6366f1">
          {objectiveProgress.length === 0 ? (
            <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>No objectives defined.</p>
          ) : (
            objectiveProgress.slice(0, 6).map(({ objective, projectName, assigned }) => {
              const done = assigned.filter((t) => t.status === 'Delivered').length;
              const pct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;
              return (
                <div key={objective.id} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    <span>{objective.title}</span>
                    <span style={{ color: pct === 100 ? '#10b981' : 'var(--dt-colors-text-primary)' }}>{pct}%</span>
                  </div>
                  <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px', marginBottom: '6px' }}>
                    {projectName} · {done}/{assigned.length} delivered
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#6366f1', borderRadius: '2px' }} />
                  </div>
                </div>
              );
            })
          )}
        </SectionCard>

        {/* Stalled tasks */}
        {stalledTasks.length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <SectionCard title={`Stalled Tasks (${stalledTasks.length})`} accent="#ef4444">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {stalledTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px',
                      border: '1px solid var(--dt-colors-border-container-default)',
                      borderLeft: '4px solid #ef4444',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{t.title}</div>
                    <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>
                      {t.projectName}
                      {t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ''}
                    </div>
                    {t.owner && (
                      <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)', marginTop: '2px' }}>
                        Owner: {t.owner}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Client Home ───────────────────────────────────────────────────────────────

const ClientHome: React.FC<{ projects: Project[]; onRefresh: () => void }> = ({ projects, onRefresh }) => {
  const LAST_VISIT_KEY = 'esa-last-visit-client';
  const [lastVisit] = useState<number>(() => {
    const prev = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    return prev;
  });

  const allTasks = projects.flatMap((p) =>
    p.tasks
      .filter((t) => t.visibility !== 'architect-only')
      .map((t) => ({ ...t, projectName: p.name }))
  );

  const myActionItems = allTasks.filter(
    (t) => (t.owner === 'Client' || t.owner === 'Both') && t.status !== 'Delivered' && t.status !== 'Finished'
  );
  const awaitingSignOff = allTasks.filter(
    (t) => (t.status === 'Delivered' || t.status === 'Finished') && !t.acknowledgedAt
  );
  const isNew = (date: string) => lastVisit > 0 && new Date(date).getTime() > lastVisit;

  const recentUpdates = allTasks
    .filter((t) => isNew(t.updatedAt ?? t.createdAt))
    .slice(0, 8);

  const newBadge = (
    <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '8px' }}>
      NEW
    </span>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Client Portal
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Welcome back</h1>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '13px', margin: '6px 0 0' }}>
            Here's what needs your attention today.
          </p>
        </div>
        <Button onClick={onRefresh} style={{ flexShrink: 0 }}>
          <Button.Prefix><RefreshIcon /></Button.Prefix>Refresh
        </Button>
      </div>

      {/* Action highlights */}
      {(myActionItems.length > 0 || awaitingSignOff.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {myActionItems.length > 0 && (
            <Surface elevation="flat" style={{ padding: '20px', borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                Your Action Items
              </div>
              <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1, color: '#3b82f6', marginBottom: '6px' }}>
                {myActionItems.length}
              </div>
              <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>Tasks assigned to you</div>
            </Surface>
          )}
          {awaitingSignOff.length > 0 && (
            <Surface elevation="flat" style={{ padding: '20px', borderTop: '3px solid #10b981' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                Ready for Sign-off
              </div>
              <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1, color: '#10b981', marginBottom: '6px' }}>
                {awaitingSignOff.length}
              </div>
              <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>
                Waiting for your acknowledgment
              </div>
            </Surface>
          )}
          {recentUpdates.length > 0 && (
            <Surface elevation="flat" style={{ padding: '20px', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                New Since Last Visit
              </div>
              <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1, color: '#8b5cf6', marginBottom: '6px' }}>
                {recentUpdates.length}
              </div>
              <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>Updated tasks</div>
            </Surface>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px' }}>
        {/* My action items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard title="Your Action Items" accent="#3b82f6">
            {myActionItems.length === 0 ? (
              <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>No open tasks assigned to you.</p>
            ) : (
              myActionItems.map((t) => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date();
                const taskAccent = t.status === 'In Progress' ? '#3b82f6' : t.status === 'Stalled' ? '#f59e0b' : '#64748b';
                return (
                  <ItemRow
                    key={t.id}
                    primary={t.title}
                    secondary={`${t.projectName} · ${t.status}${t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ''}${overdue ? ' — Overdue' : ''}`}
                    accent={taskAccent}
                    tag={isNew(t.updatedAt ?? t.createdAt) ? newBadge : undefined}
                  />
                );
              })
            )}
          </SectionCard>

          {awaitingSignOff.length > 0 && (
            <SectionCard title="Ready for Your Sign-off" accent="#10b981">
              <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px', margin: '0 0 12px' }}>
                Go to <strong>Dashboard</strong> to acknowledge these items.
              </p>
              {awaitingSignOff.map((t) => (
                <ItemRow
                  key={t.id}
                  primary={t.title}
                  secondary={`${t.projectName} · ${t.status}`}
                  accent="#10b981"
                />
              ))}
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard title="New Since Last Visit" accent="#8b5cf6">
            {recentUpdates.length === 0 ? (
              <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>
                {lastVisit === 0 ? 'First visit — check Dashboard for full detail.' : 'Nothing new since your last visit.'}
              </p>
            ) : (
              recentUpdates.map((t) => (
                <ItemRow
                  key={t.id}
                  primary={t.title}
                  secondary={`${t.projectName} · ${t.status}`}
                  accent="#8b5cf6"
                  tag={newBadge}
                />
              ))
            )}
          </SectionCard>

          <SectionCard title="Project Summary" accent="#6366f1">
            {projects.length === 0 ? (
              <p style={{ color: 'var(--dt-colors-text-secondary)', margin: 0, fontSize: '13px' }}>No projects available.</p>
            ) : (
              projects.map((p) => {
                const visible = p.tasks.filter((t) => t.visibility !== 'architect-only');
                const done = visible.filter((t) => t.status === 'Delivered' || t.status === 'Finished').length;
                const pct = visible.length > 0 ? Math.round((done / visible.length) * 100) : 0;
                return (
                  <div key={p.id} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      <span>{p.name}</span>
                      <span style={{ color: pct === 100 ? '#10b981' : 'var(--dt-colors-text-primary)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '5px', backgroundColor: 'var(--dt-colors-surface-container-subtle)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#6366f1', borderRadius: '3px' }} />
                    </div>
                    <div style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '11px' }}>
                      {done}/{visible.length} tasks complete
                      {p.expectedDate ? ` · Due ${new Date(p.expectedDate).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

// ── Entry point ───────────────────────────────────────────────────────────────

export const Home = ({ onLogout, isManager = false }: HomeProps) => {
  const [projects, setProjects] = useState<Project[]>([]);

  const loadWorkspace = () => setProjects(loadProjects());

  useEffect(() => {
    loadWorkspace();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'esa-engagements') loadWorkspace();
    };
    const onVisible = () => {
      if (!document.hidden) loadWorkspace();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', loadWorkspace);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', loadWorkspace);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isManager]);

  return isManager
    ? <ArchitectHome projects={projects} onRefresh={loadWorkspace} />
    : <ClientHome projects={projects} onRefresh={loadWorkspace} />;
};
