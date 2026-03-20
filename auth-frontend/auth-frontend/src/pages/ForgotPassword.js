import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.match(/^\S+@\S+\.\S+$/)) {
      return setAlert({ type: "error", msg: "Please enter a valid email address." });
    }

    setLoading(true);
    setAlert(null);
    try {
      const { data } = await authAPI.forgotPassword(email);
      setAlert({ type: "success", msg: data.message });
      setSent(true);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">SB</div>
          <span className="auth-logo-text">ScalableApp</span>
        </div>

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send you a reset link."}
        </p>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.type === "success" ? "✓" : "⚠"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAlert(null); }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" /> Sending...</> : "Send Reset Link →"}
            </button>
          </form>
        ) : (
          <button className="btn btn-ghost" onClick={() => { setSent(false); setAlert(null); setEmail(""); }}>
            ← Try another email
          </button>
        )}

        <div className="auth-footer">
          <Link to="/login">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
