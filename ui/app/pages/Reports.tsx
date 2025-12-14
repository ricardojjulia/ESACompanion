import React, { useState } from 'react';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';

interface Report {
  id: string;
  name: string;
  type: 'Performance' | 'Engagement' | 'Resource' | 'Financial';
  description: string;
  generatedDate: string;
  period: string;
  status: 'Draft' | 'Published' | 'Archived';
  metrics: Record<string, number | string>;
}

export const Reports = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Q4 2025 Performance Summary',
      type: 'Performance',
      description: 'Overall performance metrics for Q4',
      generatedDate: new Date().toISOString(),
      period: 'Q4 2025',
      status: 'Published',
      metrics: {
        uptime: '99.9%',
        avgResponseTime: '145ms',
        errorsResolved: 42,
      },
    },
    {
      id: '2',
      name: 'Client Engagement Report - December',
      type: 'Engagement',
      description: 'Monthly engagement statistics and trends',
      generatedDate: new Date().toISOString(),
      period: 'December 2025',
      status: 'Published',
      metrics: {
        activeClients: 12,
        totalInteractions: 87,
        completionRate: '92%',
      },
    },
    {
      id: '3',
      name: 'Resource Utilization Analysis',
      type: 'Resource',
      description: 'Analysis of team and resource allocation',
      generatedDate: new Date().toISOString(),
      period: 'November 2025',
      status: 'Draft',
      metrics: {
        teamCapacity: '78%',
        activeProjects: 8,
        allocatedBudget: '$250K',
      },
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Performance':
        return '📈';
      case 'Engagement':
        return '👥';
      case 'Resource':
        return '⚙️';
      case 'Financial':
        return '💰';
      default:
        return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return '#4caf50';
      case 'Draft':
        return '#ff9800';
      case 'Archived':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setReports(reports.filter((r) => r.id !== id));
    }
  };

  const handlePublishReport = (id: string) => {
    setReports(
      reports.map((r) =>
        r.id === id ? { ...r, status: 'Published' as const } : r
      )
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Heading level={1} style={{ marginBottom: '8px' }}>
            Reports
          </Heading>
          <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>
            View and manage performance, engagement, resource, and financial reports
          </Paragraph>
        </div>
        <Button>+ Generate New Report</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Reports List */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Heading level={3}>Available Reports</Heading>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                style={{
                  backgroundColor: selectedReport?.id === report.id ? 'var(--dt-colors-surface-selected)' : 'var(--dt-colors-surface-container-default)',
                  border: `1px solid var(--dt-colors-border-container-default)`,
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTypeIcon(report.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{report.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                      {report.period}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: `${getStatusColor(report.status)}20`,
                      color: getStatusColor(report.status),
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {report.status}
                  </div>
                </div>
                <Paragraph style={{ margin: 0, fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                  {report.description}
                </Paragraph>
              </div>
            ))}
          </div>
        </div>

        {/* Report Details */}
        <div>
          {selectedReport ? (
            <div
              style={{
                backgroundColor: 'var(--dt-colors-surface-container-default)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '8px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>{getTypeIcon(selectedReport.type)}</span>
                <div>
                  <Heading level={2} style={{ margin: 0, marginBottom: '4px' }}>
                    {selectedReport.name}
                  </Heading>
                  <div style={{ fontSize: '12px', color: 'var(--dt-colors-text-secondary)' }}>
                    {selectedReport.type} Report
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--dt-colors-border-container-default)' }}>
                <Paragraph style={{ margin: 0, fontSize: '13px', color: 'var(--dt-colors-text-primary)' }}>
                  {selectedReport.description}
                </Paragraph>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dt-colors-text-secondary)', marginBottom: '8px' }}>
                  Period
                </div>
                <div style={{ fontSize: '14px' }}>{selectedReport.period}</div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dt-colors-text-secondary)', marginBottom: '8px' }}>
                  Key Metrics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {Object.entries(selectedReport.metrics).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        backgroundColor: 'var(--dt-colors-surface-default)',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--dt-colors-border-container-default)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--dt-colors-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedReport.status === 'Draft' && (
                  <Button
                    variant="emphasized"
                    onClick={() => handlePublishReport(selectedReport.id)}
                  >
                    Publish Report
                  </Button>
                )}
                <button
                  onClick={() => {
                    handleDeleteReport(selectedReport.id);
                    setSelectedReport(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: '#d32f2f',
                    border: '1px solid #d32f2f',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Delete Report
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--dt-colors-surface-container-default)',
                border: '1px solid var(--dt-colors-border-container-default)',
                borderRadius: '8px',
                padding: '40px 24px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <Heading level={3}>No report selected</Heading>
              <Paragraph style={{ color: 'var(--dt-colors-text-secondary)' }}>
                Select a report from the list to view details
              </Paragraph>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
