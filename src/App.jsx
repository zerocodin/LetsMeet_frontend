import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Forgot from "./pages/Forgot";
import Home from "./pages/Home";
import Landing from "./pages/Landing";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
}

function LandingGate() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <Landing />;
}

const AppRoutes = () => (
  <Routes>
    {/* Public landing */}
    <Route path="/" element={<LandingGate />} />

    <Route
      path="/login"
      element={
        <PublicOnly>
          <Login />
        </PublicOnly>
      }
    />
    <Route
      path="/signup"
      element={
        <PublicOnly>
          <SignUp />
        </PublicOnly>
      }
    />
    <Route path="/forgot" element={<Forgot />} />

    {/* Protected */}
    <Route
      path="/home"
      element={
        <RequireAuth>
          <Home />
        </RequireAuth>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1500,
          style: {
            background: "#fff",
            color: "#000",
            padding: "16px",
            borderRadius: "8px",
          },
        }}
      />
    </AuthProvider>
);

export default App;