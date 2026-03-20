import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/global.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthPage from "./pages/AuthPage";

// Protected route: redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: 16
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid #1e2d45",
          borderTop: "3px solid #00d4ff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#7a8fa8", fontSize: 14, fontFamily: "'Sora', sans-serif" }}>
          Loading...
        </p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public route: redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Public */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/verify-email" element={<AuthPage />} />

    {/* Protected */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

    {/* 404 */}
    <Route path="*" element={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: 12
      }}>
        <p style={{ fontFamily: "'DM Mono', monospace", color: "#00d4ff", fontSize: 48, fontWeight: 700 }}>404</p>
        <p style={{ color: "#7a8fa8", fontFamily: "'Sora', sans-serif" }}>Page not found</p>
        <a href="/dashboard" style={{ color: "#00d4ff", fontFamily: "'Sora', sans-serif", fontSize: 14 }}>← Go home</a>
      </div>
    } />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
