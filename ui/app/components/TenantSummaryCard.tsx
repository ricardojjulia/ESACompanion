import React from 'react';
import { Heading } from '@dynatrace/strato-components/typography';

interface TenantSummaryCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
  loading: boolean;
  color: string;
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
    <div
      style={{
        backgroundColor: 'var(--dt-colors-surface-container-default)',
        border: '1px solid var(--dt-colors-border-container-default)',
        borderRadius: '8px',
        padding: '24px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}33`;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--dt-colors-border-container-default)';
      }}
    >
      {/* Decorative gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle at top right, ${color}22, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <div
        style={{
          fontSize: '36px',
          marginBottom: '12px',
          filter: 'grayscale(0.2)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <Heading level={4} style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        {title}
      </Heading>

      {/* Value */}
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          color: color,
          marginBottom: '8px',
          lineHeight: 1,
        }}
      >
        {loading ? (
          <div
            style={{
              width: '60px',
              height: '36px',
              backgroundColor: 'var(--dt-colors-surface-container-subtle)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
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

      {/* Loading animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
