import { Link } from "react-router-dom";

// Reset password is now handled inside ForgotPassword.js (step 3)
// This page just redirects users to forgot-password flow
const ResetPassword = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo" style={{ justifyContent: "center" }}>
          <div className="auth-logo-icon">SB</div>
          <span className="auth-logo-text">ScalableApp</span>
        </div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle" style={{ marginBottom: 28 }}>
          Use the forgot password flow to reset your password securely.
        </p>
        <Link to="/forgot-password" className="btn btn-primary" style={{ display: "inline-flex", width: "auto", padding: "12px 28px" }}>
          Reset Password →
        </Link>
        <div className="auth-footer">
          <Link to="/login">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;