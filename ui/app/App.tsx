import { Page } from "@dynatrace/strato-components-preview/layouts";
import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Engagements } from "./pages/Engagements";
import { ClientManagement } from "./pages/ClientManagement";
import { AnalyticsV2 } from "./pages/AnalyticsV2";
import { ESAResources } from "./pages/ESAResources";
import { Reports } from "./pages/Reports";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { SplashScreen } from "./components/SplashScreen";

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [showManagerToast, setShowManagerToast] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const isAuth = sessionStorage.getItem("esaAuthenticated");
    const user = sessionStorage.getItem("esaUser");
    const manager = sessionStorage.getItem("esaManager") === "true";

    if (isAuth === "true") {
      setIsAuthenticated(true);
      setIsManager(manager);
      if (user) {
        setUserName(user);
      }
    } else {
      // Try to get current user from Dynatrace API (simulated here)
      // In a real app, you'd call the Dynatrace User API
      setUserName("ESA Admin");
    }
  }, []);

  // Debug: log when isManager changes
  useEffect(() => {
    console.log("Manager state changed:", isManager);
  }, [isManager]);

  const handleAuthentication = (isManagerMode: boolean) => {
    console.log("Authenticating with manager mode:", isManagerMode);
    setIsAuthenticated(true);
    setIsManager(isManagerMode);
    sessionStorage.setItem("esaAuthenticated", "true");
    sessionStorage.setItem("esaUser", userName);
    sessionStorage.setItem("esaManager", String(isManagerMode));
    if (isManagerMode) {
      setShowManagerToast(true);
      setTimeout(() => setShowManagerToast(false), 3000);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("esaAuthenticated");
    sessionStorage.removeItem("esaUser");
    sessionStorage.removeItem("esaManager");
    setIsAuthenticated(false);
    setIsManager(false);
  };

  // Show splash screen if not authenticated
  if (!isAuthenticated) {
    return <SplashScreen onAuthenticated={handleAuthentication} userName={userName} />;
  }

  // Show main app if authenticated
  return (
    <Page>
      <Page.Header>
        <Header onLogout={handleLogout} userName={userName} isManager={isManager} />
      </Page.Header>
      <Page.Main>
        {showManagerToast && (
          <div style={{ position: 'fixed', top: 12, right: 12, background: '#0b1220', color: '#64c8ff', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', zIndex: 1000 }}>
            Manager Mode Active
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home onLogout={handleLogout} />} />
          <Route path="/engagements" element={<Engagements />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/analytics" element={<AnalyticsV2 />} />
          {isManager && (
            <>
              <Route path="/resources" element={<ESAResources />} />
              <Route path="/reports" element={<Reports />} />
            </>
          )}
        </Routes>
      </Page.Main>
    </Page>
  );
};
