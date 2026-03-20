import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const stats = [
    { icon: "👤", value: "1", label: "Active Session" },
    { icon: "🔒", value: user?.role === "admin" ? "Full" : user?.role === "moderator" ? "Mid" : "Basic", label: "Access Level" },
    { icon: "✉", value: user?.isEmailVerified ? "Yes" : "No", label: "Email Verified" },
    { icon: "🕐", value: formatDate(user?.lastLogin), label: "Last Login" },
  ];

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="auth-logo-icon">SB</div>
          ScalableApp
        </div>
        <div className="navbar-actions">
          <div className="user-badge">
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.name}</span>
            <span className="role-tag">{user?.role}</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          >
            {loggingOut ? "..." : "Sign Out"}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span style={{ color: "var(--accent)" }}>{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's a summary of your account and system status.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info Grid */}
        <div className="info-grid">
          {/* Account Info */}
          <div className="info-card">
            <p className="info-card-title">Account Details</p>
            {[
              { key: "Name", val: user?.name },
              { key: "Email", val: user?.email },
              { key: "User ID", val: user?.id?.slice(-8) + "..." },
              { key: "Account Since", val: formatDate(user?.createdAt) },
            ].map(({ key, val }) => (
              <div className="info-row" key={key}>
                <span className="info-row-key">{key}</span>
                <span className="info-row-value">{val || "—"}</span>
              </div>
            ))}
          </div>

          {/* Security Info */}
          <div className="info-card">
            <p className="info-card-title">Security & Access</p>
            <div className="info-row">
              <span className="info-row-key">Email Status</span>
              {user?.isEmailVerified
                ? <span className="verified-badge">✓ Verified</span>
                : <span className="unverified-badge">⚠ Not Verified</span>
              }
            </div>
            <div className="info-row">
              <span className="info-row-key">Role</span>
              <span className="role-tag">{user?.role}</span>
            </div>
            <div className="info-row">
              <span className="info-row-key">Account Status</span>
              <span style={{ color: user?.isActive ? "var(--success)" : "var(--error)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {user?.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-key">Last Login</span>
              <span className="info-row-value">{formatDate(user?.lastLogin)}</span>
            </div>
          </div>
        </div>

        {/* System Info Bar */}
        <div style={{
          marginTop: 16,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          color: "var(--text-secondary)",
          animation: "slideUp 0.5s ease 0.35s both"
        }}>
          <span style={{ color: "var(--success)", fontSize: 10 }}>●</span>
          <span>Backend API &amp; Redis cache are running.</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {new Date().toLocaleTimeString("en-IN")}
          </span>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
