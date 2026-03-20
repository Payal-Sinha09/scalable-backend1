import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authAPI } from "../api";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        setMessage(data.message || "Email verified successfully!");
        setStatus("success");
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo" style={{ justifyContent: "center" }}>
          <div className="auth-logo-icon">SB</div>
          <span className="auth-logo-text">ScalableApp</span>
        </div>

        {status === "loading" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
              <div style={{
                width: 48, height: 48,
                border: "3px solid var(--border)",
                borderTop: "3px solid var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
            </div>
            <h2 className="auth-title">Verifying your email...</h2>
            <p className="auth-subtitle">Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 64, height: 64,
              background: "var(--success-dim)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 24px",
              animation: "slideUp 0.4s ease"
            }}>✓</div>
            <h2 className="auth-title">Email Verified!</h2>
            <p className="auth-subtitle" style={{ marginBottom: 28 }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: "inline-flex", width: "auto", padding: "12px 28px" }}>
              Sign In →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 64, height: 64,
              background: "var(--error-dim)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 24px",
              animation: "slideUp 0.4s ease"
            }}>⚠</div>
            <h2 className="auth-title">Verification Failed</h2>
            <p className="auth-subtitle" style={{ marginBottom: 28 }}>{message}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link to="/register" className="btn btn-primary">
                Register Again
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
