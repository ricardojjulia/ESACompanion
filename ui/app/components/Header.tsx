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
        <AppHeader.NavItem as={Link} to="/engagements">
          Engagements
        </AppHeader.NavItem>
        <AppHeader.NavItem as={Link} to="/clients">
          Client Updates
        </AppHeader.NavItem>
        <AppHeader.NavItem as={Link} to="/analytics">
          Analytics
        </AppHeader.NavItem>
        {isManager && (
          <AppHeader.NavItem as={Link} to="/resources">
            ESA Resources
          </AppHeader.NavItem>
        )}
      </AppHeader.NavItems>
      <AppHeader.ActionItems>
        {userName && (
          <Text>{userName}</Text>
        )}
        <Button variant="default" onClick={onLogout}>
          Logout
        </Button>
      </AppHeader.ActionItems>
    </AppHeader>
  );
};
