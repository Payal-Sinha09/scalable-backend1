// import { useState } from "react";
// import { Link, useNavigate, useSearchParams } from "react-router-dom";
// import { authAPI } from "../api";

// const ResetPassword = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");

//   const [form, setForm] = useState({ password: "", confirmPassword: "" });
//   const [loading, setLoading] = useState(false);
//   const [alert, setAlert] = useState(null);
//   const [showPass, setShowPass] = useState(false);
//   const [done, setDone] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (form.password.length < 8) {
//       return setAlert({ type: "error", msg: "Password must be at least 8 characters." });
//     }
//     if (form.password !== form.confirmPassword) {
//       return setAlert({ type: "error", msg: "Passwords do not match." });
//     }
//     if (!token) {
//       return setAlert({ type: "error", msg: "Invalid reset link. Please request a new one." });
//     }

//     setLoading(true);
//     setAlert(null);
//     try {
//       const { data } = await authAPI.resetPassword(token, form.password);
//       setAlert({ type: "success", msg: data.message });
//       setDone(true);
//       setTimeout(() => navigate("/login", { state: { message: "Password reset! Please sign in." } }), 2500);
//     } catch (err) {
//       setAlert({ type: "error", msg: err.response?.data?.message || "Reset failed. The link may have expired." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-layout">
//       <div className="auth-card">
//         <div className="auth-logo">
//           <div className="auth-logo-icon">SB</div>
//           <span className="auth-logo-text">ScalableApp</span>
//         </div>

//         <h1 className="auth-title">New password</h1>
//         <p className="auth-subtitle">Choose a strong password for your account</p>

//         {alert && (
//           <div className={`alert alert-${alert.type}`}>
//             <span>{alert.type === "success" ? "✓" : "⚠"}</span>
//             <span>{alert.msg}</span>
//           </div>
//         )}

//         {!done && (
//           <form onSubmit={handleSubmit}>
//             <div className="form-group">
//               <label className="form-label">New Password</label>
//               <div className="input-wrapper">
//                 <input
//                   className="form-input"
//                   type={showPass ? "text" : "password"}
//                   placeholder="Min 8 characters"
//                   value={form.password}
//                   onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
//                   autoFocus
//                 />
//                 <button type="button" className="input-toggle" onClick={() => setShowPass((p) => !p)}>
//                   {showPass ? "🙈" : "👁"}
//                 </button>
//               </div>
//             </div>

//             <div className="form-group">
//               <label className="form-label">Confirm New Password</label>
//               <input
//                 className="form-input"
//                 type="password"
//                 placeholder="Repeat your new password"
//                 value={form.confirmPassword}
//                 onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
//               />
//             </div>

//             <button className="btn btn-primary" type="submit" disabled={loading || !token} style={{ marginTop: 8 }}>
//               {loading ? <><span className="spinner" /> Resetting...</> : "Reset Password →"}
//             </button>
//           </form>
//         )}

//         <div className="auth-footer">
//           <Link to="/login">← Back to Sign in</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;


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
