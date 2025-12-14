import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components-preview/layouts";

interface HeaderProps {
  onLogout?: () => void;
  userName?: string;
  isManager?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, userName, isManager }) => {
  return (
    <AppHeader>
      <AppHeader.NavItems>
        <AppHeader.AppNavLink as={Link} to="/" />
        {isManager ? (
          <>
            <AppHeader.NavItem as={Link} to="/resources">
              ESA Resources
            </AppHeader.NavItem>
            <AppHeader.NavItem as={Link} to="/reports">
              Team Reports
            </AppHeader.NavItem>
            <AppHeader.NavItem as={Link} to="/analytics">
              Analytics V2.0
            </AppHeader.NavItem>
          </>
        ) : (
          <>
            <AppHeader.NavItem as={Link} to="/engagements">
              Engagement Management
            </AppHeader.NavItem>
            <AppHeader.NavItem as={Link} to="/clients">
              Client Management
            </AppHeader.NavItem>
            <AppHeader.NavItem as={Link} to="/analytics">
              Analytics V2.0
            </AppHeader.NavItem>
          </>
        )}
      </AppHeader.NavItems>
      <AppHeader.ActionItems>
        {userName && (
          <span style={{ color: 'var(--dt-colors-text-secondary)', fontSize: '12px' }}>
            {userName}
          </span>
        )}
        <button
          onClick={onLogout}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--dt-colors-border-container-default)',
            backgroundColor: 'var(--dt-colors-surface-default)',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Logout
        </button>
      </AppHeader.ActionItems>
    </AppHeader>
  );
};
