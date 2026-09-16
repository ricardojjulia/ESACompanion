import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@dynatrace/strato-components/buttons";
import { Text } from "@dynatrace/strato-components/typography";
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
        {isManager && (
          <AppHeader.NavItem as={Link} to="/projects">
            Project Management
          </AppHeader.NavItem>
        )}
        <AppHeader.NavItem as={Link} to="/dashboard">
          Project Dashboard
        </AppHeader.NavItem>
      </AppHeader.NavItems>
      <AppHeader.ActionItems>
        {userName && <Text>{userName}</Text>}
        <Button variant="default" onClick={onLogout}>
          Logout
        </Button>
      </AppHeader.ActionItems>
    </AppHeader>
  );
};
