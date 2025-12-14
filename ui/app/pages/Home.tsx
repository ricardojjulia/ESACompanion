import React, { useCallback, useEffect, useState } from "react";
import { Heading } from "@dynatrace/strato-components/typography";
import { TenantSummaryCard } from "../components/TenantSummaryCard";

interface EngagementMetrics {
  totalEngagements: number;
  totalTasks: number;
  tasksNotStarted: number;
  tasksInProgress: number;
  tasksStalled: number;
  tasksFinished: number;
  tasksClosed: number;
  loading: boolean;
}

interface HomeProps {
  onLogout?: () => void;
}

export const Home = ({ onLogout }: HomeProps) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showESATasks, setShowESATasks] = useState(false);
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    totalEngagements: 0,
    totalTasks: 0,
    tasksNotStarted: 0,
    tasksInProgress: 0,
    tasksStalled: 0,
    tasksFinished: 0,
    tasksClosed: 0,
    loading: true,
  });

  useEffect(() => {
    const loadEngagementMetrics = () => {
      try {
        // Load engagements from localStorage (safe parse)
        const storedEngagements = localStorage.getItem('esa-engagements');
        let engagements: any[] = [];
        if (storedEngagements) {
          try {
            engagements = JSON.parse(storedEngagements);
          } catch (e) {
            console.warn('Failed to parse engagements from localStorage. Resetting.', e);
            engagements = [];
          }
        }
        
        console.log('Loaded engagements:', engagements);
        
        // Count all tasks by status
        let totalTasks = 0;
        let tasksNotStarted = 0;
        let tasksInProgress = 0;
        let tasksStalled = 0;
        let tasksFinished = 0;
        let tasksClosed = 0;
        
        engagements.forEach((engagement: any) => {
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
        
        const newMetrics = {
          totalEngagements: engagements.length,
          totalTasks,
          tasksNotStarted,
          tasksInProgress,
          tasksStalled,
          tasksFinished,
          tasksClosed,
          loading: false,
        };
        
        console.log('Engagement metrics:', newMetrics);
        setMetrics(newMetrics);
      } catch (error) {
        console.error('Error loading engagement metrics:', error);
        setMetrics({
          totalEngagements: 0,
          totalTasks: 0,
          tasksNotStarted: 0,
          tasksInProgress: 0,
          tasksStalled: 0,
          tasksFinished: 0,
          tasksClosed: 0,
          loading: false,
        });
      }
    };

    loadEngagementMetrics();
    
    // Listen for storage events to update when engagements change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'esa-engagements') {
        loadEngagementMetrics();
      }
    };
    
    // Refresh when page becomes visible (e.g., when navigating back from engagements page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible, refreshing metrics...');
        loadEngagementMetrics();
      }
    };
    
    // Refresh when window gets focus
    const handleFocus = () => {
      console.log('Window focused, refreshing metrics...');
      loadEngagementMetrics();
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Also refresh every 5 seconds to catch any changes
    const refreshInterval = setInterval(() => {
      loadEngagementMetrics();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, []);

  // Get filtered tasks for detailed view
  const getFilteredTasks = useCallback(() => {
    const storedEngagements = localStorage.getItem('esa-engagements');
    let engagements: any[] = [];
    if (storedEngagements) {
      try {
        engagements = JSON.parse(storedEngagements);
      } catch (e) {
        engagements = [];
      }
    }

    let allTasks: any[] = [];
    engagements.forEach((eng) => {
      allTasks.push(...(eng.tasks || []).map((t: any) => ({ ...t, engagementName: eng.name })));
    });

    if (!selectedFilter) return allTasks;

    if (selectedFilter === 'complete') {
      return allTasks.filter((t) => t.status === 'Finished' || t.status === 'Delivered');
    }
    return allTasks.filter((t) => t.status === selectedFilter);
  }, [selectedFilter]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    // Force metrics reload by updating a dummy state via storage event
    console.log('Manual refresh clicked');
    // Re-run the same logic in effect by calling it inline
    const storedEngagements = localStorage.getItem('esa-engagements');
    let engagements: any[] = [];
    if (storedEngagements) {
      try {
        engagements = JSON.parse(storedEngagements);
      } catch (e) {
        engagements = [];
      }
    }
    let totalTasks = 0;
    let tasksNotStarted = 0;
    let tasksInProgress = 0;
    let tasksStalled = 0;
    let tasksFinished = 0;
    let tasksClosed = 0;
    engagements.forEach((engagement: any) => {
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
    setMetrics({
      totalEngagements: engagements.length,
      totalTasks,
      tasksNotStarted,
      tasksInProgress,
      tasksStalled,
      tasksFinished,
      tasksClosed,
      loading: false,
    });
  }, []);

  // Generate AI-like suggestions based on metrics
  const generateInsights = () => {
    const insights: string[] = [];
    
    if (metrics.tasksStalled > 0) {
      insights.push(`⚠️ You have ${metrics.tasksStalled} stalled task${metrics.tasksStalled > 1 ? 's' : ''}. Consider reviewing blockers and reassigning resources.`);
    }
    
    if (metrics.tasksNotStarted > 3) {
      insights.push(`📋 ${metrics.tasksNotStarted} tasks haven't started yet. Prioritize and assign them to prevent backlog.`);
    }
    
    if (metrics.tasksFinished > 0) {
      insights.push(`✨ ${metrics.tasksFinished} task${metrics.tasksFinished > 1 ? 's are' : ' is'} ready for delivery. Schedule client review sessions.`);
    }
    
    if (metrics.tasksInProgress > 5) {
      insights.push(`🔥 High workload detected with ${metrics.tasksInProgress} active tasks. Consider load balancing across team.`);
    }
    
    if (metrics.totalTasks > 0 && metrics.tasksClosed + metrics.tasksFinished === 0) {
      insights.push(`🎯 No completed tasks yet. Focus on quick wins to build momentum.`);
    }
    
    if (metrics.totalEngagements === 0) {
      insights.push(`💡 No engagements created. Start by documenting your active client projects.`);
    }
    
    const completionRate = metrics.totalTasks > 0 ? Math.round(((metrics.tasksClosed + metrics.tasksFinished) / metrics.totalTasks) * 100) : 0;
    if (completionRate > 75) {
      insights.push(`🎊 Excellent progress! ${completionRate}% completion rate. Keep up the great work!`);
    }
    
    if (insights.length === 0) {
      insights.push(`✅ Everything looks good! Your engagements are well-balanced.`);
    }
    
    return insights;
  };

  const esaNormalTasks = [
    { icon: '🏗️', title: 'Architecture Review', description: 'Review and validate technical architecture decisions across projects' },
    { icon: '📐', title: 'Standards & Governance', description: 'Ensure compliance with enterprise architecture standards and best practices' },
    { icon: '🔄', title: 'Technology Roadmap', description: 'Update and communicate technology roadmap to stakeholders' },
    { icon: '👥', title: 'Stakeholder Alignment', description: 'Meet with business and technical stakeholders to align on architecture vision' },
    { icon: '📊', title: 'Portfolio Analysis', description: 'Analyze application portfolio and identify optimization opportunities' },
    { icon: '🔐', title: 'Security Assessment', description: 'Review security architecture and compliance requirements' },
    { icon: '💰', title: 'Cost Optimization', description: 'Identify opportunities to reduce infrastructure and licensing costs' },
    { icon: '📚', title: 'Documentation Updates', description: 'Maintain architecture documentation, patterns, and decision records' },
    { icon: '🎓', title: 'Team Enablement', description: 'Mentor development teams on architectural patterns and best practices' },
    { icon: '🔍', title: 'Technical Debt Review', description: 'Assess and prioritize technical debt across the portfolio' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={1} style={{ marginBottom: '8px' }}>
          ESA Companion Dashboard
        </Heading>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '14px', margin: 0 }}>
            Overview of your engagements and task progress
          </p>
          <button
            onClick={handleManualRefresh}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--dt-colors-border-container-default)',
              backgroundColor: 'var(--dt-colors-surface-default)',
              cursor: 'pointer',
            }}
            title="Refresh metrics"
          >
            🔄 Refresh
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                backgroundColor: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Sign out"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      {/* AI-Powered Analytics & Insights */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ marginBottom: '8px' }}>
              <Heading level={2} style={{ margin: 0, color: '#ffffff' }}>
                ESA Companion Analytics
              </Heading>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              AI-powered insights based on your current workload
            </p>
          </div>
          <button
            onClick={() => setShowESATasks(!showESATasks)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            📋 ESA Normal Tasks
          </button>
        </div>

        {/* Insights List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {generateInsights().map((insight, index) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              {insight}
            </div>
          ))}
        </div>

        {/* ESA Normal Tasks Expansion */}
        {showESATasks && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Heading level={3} style={{ marginTop: 0, marginBottom: '16px', color: '#ffffff' }}>
              Enterprise Solution Architect - Daily Tasks
            </Heading>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
              }}
            >
              {esaNormalTasks.map((task, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{task.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85, lineHeight: '1.4' }}>
                    {task.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}
      >
        <div onClick={() => setSelectedFilter(null)} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Total Engagements"
            value={metrics.totalEngagements}
            icon="📋"
            description="Active client engagements"
            loading={metrics.loading}
            color="#1496ff"
          />
        </div>
        <div onClick={() => setSelectedFilter('In Progress')} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Tasks In Progress"
            value={metrics.tasksInProgress}
            icon="⚡"
            description="Currently being worked on"
            loading={metrics.loading}
            color="#2196f3"
          />
        </div>
        <div onClick={() => setSelectedFilter('Delivered')} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Tasks Closed"
            value={metrics.tasksClosed}
            icon="✅"
            description="Delivered to clients"
            loading={metrics.loading}
            color="#4caf50"
          />
        </div>
        <div onClick={() => setSelectedFilter('Not Started')} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Not Started"
            value={metrics.tasksNotStarted}
            icon="⏸️"
            description="Awaiting action"
            loading={metrics.loading}
            color="#757575"
          />
        </div>
        <div onClick={() => setSelectedFilter('Stalled')} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Stalled"
            value={metrics.tasksStalled}
            icon="⚠️"
            description="Blocked or on hold"
            loading={metrics.loading}
            color="#ff9800"
          />
        </div>
        <div onClick={() => setSelectedFilter('Finished')} style={{ cursor: 'pointer' }}>
          <TenantSummaryCard
            title="Finished"
            value={metrics.tasksFinished}
            icon="🎯"
            description="Ready for delivery"
            loading={metrics.loading}
            color="#9c27b0"
          />
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div
        style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: 'var(--dt-colors-surface-container-default)',
          borderRadius: '8px',
          border: '1px solid var(--dt-colors-border-container-default)',
        }}
      >
        <Heading level={3} style={{ marginBottom: '16px' }}>
          Engagement Overview
        </Heading>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
              Total Tasks
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>
              {metrics.loading ? '...' : metrics.totalTasks}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
              Completion Rate
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#4caf50' }}>
              {metrics.loading ? '...' : metrics.totalTasks > 0 ? `${Math.round(((metrics.tasksClosed + metrics.tasksFinished) / metrics.totalTasks) * 100)}%` : '0%'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
              Active Work
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#2196f3' }}>
              {metrics.loading ? '...' : metrics.tasksInProgress}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px' }}>
              Needs Attention
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff9800' }}>
              {metrics.loading ? '...' : metrics.tasksStalled + metrics.tasksNotStarted}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Tasks Details */}
      {selectedFilter && (
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: 'var(--dt-colors-surface-container-default)',
            borderRadius: '8px',
            border: '1px solid var(--dt-colors-border-container-default)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Heading level={3} style={{ margin: 0 }}>
              {selectedFilter === 'complete' ? 'Completed Tasks' : `Tasks: ${selectedFilter}`}
            </Heading>
            <button
              onClick={() => setSelectedFilter(null)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--dt-colors-border-container-default)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕ Clear Filter
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '12px',
            }}
          >
            {getFilteredTasks().length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--dt-colors-text-secondary)', padding: '24px' }}>
                No tasks in this category
              </div>
            ) : (
              getFilteredTasks().map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--dt-colors-surface-default)',
                    border: '1px solid var(--dt-colors-border-container-default)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)', marginBottom: '6px' }}>
                    {task.description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)' }}>
                    📁 {task.engagementName} • 📅 {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

