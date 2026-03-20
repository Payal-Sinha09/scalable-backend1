import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setAlert(null);
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    setAlert(null);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setAlert({ type: "error", msg });
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.type === "success" ? "✓" : "⚠"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        {location.state?.message && (
          <div className="alert alert-info">
            <span>ℹ</span>
            <span>{location.state.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className={`form-input ${errors.email ? "error" : ""}`}
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-wrapper">
              <input
                className={`form-input ${errors.password ? "error" : ""}`}
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button type="button" className="input-toggle" onClick={() => setShowPass((p) => !p)}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" /> Signing in...</> : "Sign In →"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
