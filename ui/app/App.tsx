import { Page } from "@dynatrace/strato-components-preview/layouts";
import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Engagements } from "./pages/Engagements";
import { ClientManagement } from "./pages/ClientManagement";
import { AnalyticsV2 } from "./pages/AnalyticsV2";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { SplashScreen } from "./components/SplashScreen";

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("Guest User");

  // Check if user is already authenticated
  useEffect(() => {
    const isAuth = sessionStorage.getItem("esaAuthenticated");
    const user = sessionStorage.getItem("esaUser");

    if (isAuth === "true") {
      setIsAuthenticated(true);
      if (user) {
        setUserName(user);
      }
    } else {
      // Try to get current user from Dynatrace API (simulated here)
      // In a real app, you'd call the Dynatrace User API
      setUserName("ESA Admin");
    }
  }, []);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem("esaAuthenticated", "true");
    sessionStorage.setItem("esaUser", userName);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("esaAuthenticated");
    sessionStorage.removeItem("esaUser");
    setIsAuthenticated(false);
  };

  // Show splash screen if not authenticated
  if (!isAuthenticated) {
    return <SplashScreen onAuthenticated={handleAuthentication} userName={userName} />;
  }

  // Show main app if authenticated
  return (
    <Page>
      <Page.Header>
        <Header onLogout={handleLogout} userName={userName} />
      </Page.Header>
      <Page.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/engagements" element={<Engagements />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/analytics" element={<AnalyticsV2 />} />
        </Routes>
      </Page.Main>
    </Page>
  );
};
