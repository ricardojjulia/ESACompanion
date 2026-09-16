import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Projects } from "./pages/Projects";
import { ProjectDashboard } from "./pages/ProjectDashboard";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { SplashScreen } from "./components/SplashScreen";

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("esaAuthenticated");
    const mode = sessionStorage.getItem("esaMode");
    if (isAuth === "true") {
      setIsAuthenticated(true);
      setIsManager(mode === "architect");
    }
  }, []);

  const handleAuthentication = (architectMode: boolean) => {
    setIsAuthenticated(true);
    setIsManager(architectMode);
    sessionStorage.setItem("esaAuthenticated", "true");
    sessionStorage.setItem("esaMode", architectMode ? "architect" : "client");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("esaAuthenticated");
    sessionStorage.removeItem("esaMode");
    sessionStorage.removeItem("esaManager");
    sessionStorage.removeItem("esaAppId");
    setIsAuthenticated(false);
    setIsManager(false);
  };

  if (!isAuthenticated) {
    return <SplashScreen onAuthenticated={handleAuthentication} />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--dt-colors-surface-container-default)",
      }}
    >
      <Sidebar isManager={isManager} onLogout={handleLogout} />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route
            path="/"
            element={<Home onLogout={handleLogout} isManager={isManager} userAppId={null} />}
          />
          <Route path="/projects" element={<Projects isManager={isManager} />} />
          <Route path="/dashboard" element={<ProjectDashboard isManager={isManager} />} />
        </Routes>
      </div>
    </div>
  );
};
