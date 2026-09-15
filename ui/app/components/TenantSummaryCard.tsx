import React from 'react';
import { Skeleton } from '@dynatrace/strato-components/content';
import { Surface } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';

interface TenantSummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  loading: boolean;
  color: 'primary' | 'success' | 'warning' | 'critical' | 'neutral';
}

export const TenantSummaryCard: React.FC<TenantSummaryCardProps> = ({
  title,
  value,
  icon,
  description,
  loading,
  color,
}) => {
  return (
    <Surface
      elevation="flat"
      color={color}
      style={{
        padding: '24px',
        cursor: 'pointer',
      }}
    >
      <div aria-hidden="true" style={{ marginBottom: '12px' }}>{icon}</div>

      {/* Title */}
      <Heading level={4} style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        {title}
      </Heading>

      {/* Value */}
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '8px',
          lineHeight: 1,
        }}
      >
        {loading ? (
          <Skeleton width="60px" height="36px" variant="rounded" />
        ) : (
          value.toLocaleString()
        )}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--dt-colors-text-secondary)',
          lineHeight: 1.4,
        }}
      >
        {description}
      </div>

    </Surface>
  );
};
