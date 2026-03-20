// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { authAPI } from "../api";

// const ForgotPassword = () => {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [alert, setAlert] = useState(null);
//   const [sent, setSent] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!email.match(/^\S+@\S+\.\S+$/)) {
//       return setAlert({ type: "error", msg: "Please enter a valid email address." });
//     }

//     setLoading(true);
//     setAlert(null);
//     try {
//       const { data } = await authAPI.forgotPassword(email);
//       setAlert({ type: "success", msg: data.message });
//       setSent(true);
//     } catch (err) {
//       setAlert({ type: "error", msg: err.response?.data?.message || "Something went wrong." });
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

//         <h1 className="auth-title">Reset password</h1>
//         <p className="auth-subtitle">
//           {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send you a reset link."}
//         </p>

//         {alert && (
//           <div className={`alert alert-${alert.type}`}>
//             <span>{alert.type === "success" ? "✓" : "⚠"}</span>
//             <span>{alert.msg}</span>
//           </div>
//         )}

//         {!sent ? (
//           <form onSubmit={handleSubmit}>
//             <div className="form-group">
//               <label className="form-label">Email Address</label>
//               <input
//                 className="form-input"
//                 type="email"
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={(e) => { setEmail(e.target.value); setAlert(null); }}
//                 autoFocus
//               />
//             </div>
//             <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
//               {loading ? <><span className="spinner" /> Sending...</> : "Send Reset Link →"}
//             </button>
//           </form>
//         ) : (
//           <button className="btn btn-ghost" onClick={() => { setSent(false); setAlert(null); setEmail(""); }}>
//             ← Try another email
//           </button>
//         )}

//         <div className="auth-footer">
//           <Link to="/login">← Back to Sign in</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: answer, 3: new password
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPass, setShowPass] = useState(false);

  // Step 1: Get security question
  const handleGetQuestion = async (e) => {
    e.preventDefault();
    if (!email.match(/^\S+@\S+\.\S+$/)) return setAlert({ type: "error", msg: "Enter a valid email." });
    setLoading(true);
    setAlert(null);
    try {
      const { data } = await authAPI.getSecurityQuestion(email);
      setSecurityQuestion(data.data.securityQuestion);
      setStep(2);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Email not found." });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify security answer
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    if (!securityAnswer.trim()) return setAlert({ type: "error", msg: "Please enter your answer." });
    setLoading(true);
    setAlert(null);
    try {
      const { data } = await authAPI.verifySecurityAnswer(email, securityAnswer);
      setResetToken(data.data.resetToken);
      setStep(3);
      setAlert({ type: "success", msg: "Answer verified! Set your new password." });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Incorrect answer." });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return setAlert({ type: "error", msg: "Password must be at least 8 characters." });
    if (newPassword !== confirmPassword) return setAlert({ type: "error", msg: "Passwords do not match." });
    setLoading(true);
    setAlert(null);
    try {
      await authAPI.resetPasswordDirect(resetToken, newPassword);
      setAlert({ type: "success", msg: "Password reset successful! Redirecting to login..." });
      setTimeout(() => navigate("/login", { state: { message: "Password reset! Please sign in." } }), 2000);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Reset failed. Try again." });
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

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= s ? "var(--accent)" : "var(--border)",
              transition: "background 0.3s ease"
            }} />
          ))}
        </div>

        <h1 className="auth-title">
          {step === 1 && "Reset password"}
          {step === 2 && "Security question"}
          {step === 3 && "New password"}
        </h1>
        <p className="auth-subtitle">
          {step === 1 && "Enter your email to get started"}
          {step === 2 && "Answer your security question"}
          {step === 3 && "Choose a strong new password"}
        </p>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.type === "success" ? "✓" : "⚠"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleGetQuestion}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setAlert(null); }} autoFocus />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" /> Checking...</> : "Continue →"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyAnswer}>
            <div className="form-group">
              <label className="form-label">Your Security Question</label>
              <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 14, color: "var(--text-secondary)" }}>
                {securityQuestion}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Answer</label>
              <input className="form-input" type="text" placeholder="Enter your answer" value={securityAnswer} onChange={(e) => { setSecurityAnswer(e.target.value); setAlert(null); }} autoFocus />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" /> Verifying...</> : "Verify Answer →"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setStep(1); setAlert(null); }} style={{ marginTop: 8 }}>
              ← Back
            </button>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <input className="form-input" type={showPass ? "text" : "password"} placeholder="Min 8 characters" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setAlert(null); }} autoFocus />
                <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="Repeat new password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setAlert(null); }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" /> Resetting...</> : "Reset Password →"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
