import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@dynatrace/strato-components/buttons';
import { BarChartIcon, FolderOpenIcon, HomeIcon } from '@dynatrace/strato-icons';

const SIDEBAR_BG = '#0c1425';
const ACCENT_BLUE = '#3b82f6';
const ACCENT_GREEN = '#10b981';

interface SidebarProps {
  isManager: boolean;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/', icon: HomeIcon, label: 'Home', managerOnly: false },
  { to: '/projects', icon: FolderOpenIcon, label: 'Projects', managerOnly: true },
  { to: '/dashboard', icon: BarChartIcon, label: 'Dashboard', managerOnly: false },
];

export const Sidebar: React.FC<SidebarProps> = ({ isManager, onLogout }) => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div
      style={{
        width: '220px',
        flexShrink: 0,
        height: '100%',
        backgroundColor: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Branding */}
      <div
        style={{
          padding: '22px 18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: ACCENT_BLUE,
            letterSpacing: '0.3px',
            marginBottom: '2px',
          }}
        >
          ESA Companion
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)' }}>
          Project Management
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.filter((item) => !item.managerOnly || isManager).map(
          ({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  margin: '2px 8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: active ? '#fff' : 'rgba(255,255,255,0.52)',
                  backgroundColor: active ? 'rgba(59,130,246,0.14)' : 'transparent',
                  borderLeft: `3px solid ${active ? ACCENT_BLUE : 'transparent'}`,
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s ease',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: active ? ACCENT_BLUE : 'rgba(255,255,255,0.38)',
                    flexShrink: 0,
                  }}
                />
                {label}
              </Link>
            );
          }
        )}
      </nav>

      {/* Mode badge + Sign Out */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px 3px 8px',
            borderRadius: '20px',
            marginBottom: '12px',
            backgroundColor: isManager
              ? 'rgba(59,130,246,0.12)'
              : 'rgba(16,185,129,0.12)',
            border: `1px solid ${isManager ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isManager ? ACCENT_BLUE : ACCENT_GREEN,
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: isManager ? ACCENT_BLUE : ACCENT_GREEN,
            }}
          >
            {isManager ? 'ARCHITECT' : 'CLIENT'}
          </span>
        </div>
        <Button variant="default" onClick={onLogout} style={{ width: '100%' }}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};
