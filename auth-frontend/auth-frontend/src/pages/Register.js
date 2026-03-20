// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { authAPI } from "../api";

// const Register = () => {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [alert, setAlert] = useState(null);
//   const [showPass, setShowPass] = useState(false);

//   const validate = () => {
//     const e = {};
//     if (!form.name.trim() || form.name.length < 2) e.name = "Name must be at least 2 characters";
//     if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = "Enter a valid email address";
//     if (form.password.length < 8) e.password = "Password must be at least 8 characters";
//     if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
//     return e;
//   };

//   const handleChange = (e) => {
//     setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
//     setErrors((p) => ({ ...p, [e.target.name]: "" }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const errs = validate();
//     if (Object.keys(errs).length) return setErrors(errs);

//     setLoading(true);
//     setAlert(null);
//     try {
//       const { data } = await authAPI.register({
//         name: form.name,
//         email: form.email,
//         password: form.password,
//       });
//       setAlert({ type: "success", msg: data.message || "Check your email to verify your account!" });
//       setTimeout(() => navigate("/login"), 3000);
//     } catch (err) {
//       setAlert({ type: "error", msg: err.response?.data?.message || "Registration failed. Try again." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-layout">
//       <div className="auth-card">
//         {/* Logo */}
//         <div className="auth-logo">
//           <div className="auth-logo-icon">SB</div>
//           <span className="auth-logo-text">ScalableApp</span>
//         </div>

//         <h1 className="auth-title">Create account</h1>
//         <p className="auth-subtitle">Join ScalableApp — takes less than a minute</p>

//         {alert && (
//           <div className={`alert alert-${alert.type}`}>
//             <span>{alert.type === "success" ? "✓" : "⚠"}</span>
//             <span>{alert.msg}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} noValidate>
//           <div className="form-group">
//             <label className="form-label">Full Name</label>
//             <input
//               className={`form-input ${errors.name ? "error" : ""}`}
//               name="name"
//               type="text"
//               placeholder="Payal Sinha"
//               value={form.name}
//               onChange={handleChange}
//               autoComplete="name"
//             />
//             {errors.name && <p className="form-error">⚠ {errors.name}</p>}
//           </div>

//           <div className="form-group">
//             <label className="form-label">Email Address</label>
//             <input
//               className={`form-input ${errors.email ? "error" : ""}`}
//               name="email"
//               type="email"
//               placeholder="you@example.com"
//               value={form.email}
//               onChange={handleChange}
//               autoComplete="email"
//             />
//             {errors.email && <p className="form-error">⚠ {errors.email}</p>}
//           </div>

//           <div className="form-group">
//             <label className="form-label">Password</label>
//             <div className="input-wrapper">
//               <input
//                 className={`form-input ${errors.password ? "error" : ""}`}
//                 name="password"
//                 type={showPass ? "text" : "password"}
//                 placeholder="Min 8 characters"
//                 value={form.password}
//                 onChange={handleChange}
//                 autoComplete="new-password"
//               />
//               <button type="button" className="input-toggle" onClick={() => setShowPass((p) => !p)}>
//                 {showPass ? "🙈" : "👁"}
//               </button>
//             </div>
//             {errors.password && <p className="form-error">⚠ {errors.password}</p>}
//           </div>

//           <div className="form-group">
//             <label className="form-label">Confirm Password</label>
//             <input
//               className={`form-input ${errors.confirmPassword ? "error" : ""}`}
//               name="confirmPassword"
//               type="password"
//               placeholder="Repeat your password"
//               value={form.confirmPassword}
//               onChange={handleChange}
//               autoComplete="new-password"
//             />
//             {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword}</p>}
//           </div>

//           <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
//             {loading ? <><span className="spinner" /> Creating account...</> : "Create Account →"}
//           </button>
//         </form>

//         <div className="auth-footer">
//           Already have an account? <Link to="/login">Sign in</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favourite movie?",
  "What city were you born in?",
  "What is your oldest sibling's name?",
];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = "Enter a valid email address";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.securityAnswer.trim()) e.securityAnswer = "Security answer is required";
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    setAlert(null);
    try {
      const { data } = await authAPI.register({
        name: form.name, email: form.email, password: form.password,
        securityQuestion: form.securityQuestion, securityAnswer: form.securityAnswer,
      });
      setAlert({ type: "success", msg: data.message });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Registration failed. Try again." });
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Takes less than a minute</p>

        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>{alert.type === "success" ? "✓" : "⚠"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className={`form-input ${errors.name ? "error" : ""}`} name="name" type="text" placeholder="Payal Sinha" value={form.name} onChange={handleChange} />
            {errors.name && <p className="form-error">⚠ {errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className={`form-input ${errors.email ? "error" : ""}`} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input className={`form-input ${errors.password ? "error" : ""}`} name="password" type={showPass ? "text" : "password"} placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
              <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
            </div>
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className={`form-input ${errors.confirmPassword ? "error" : ""}`} name="confirmPassword" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} />
            {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Security Question</label>
            <select className="form-input" name="securityQuestion" value={form.securityQuestion} onChange={handleChange} style={{ cursor: "pointer" }}>
              {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Security Answer</label>
            <input className={`form-input ${errors.securityAnswer ? "error" : ""}`} name="securityAnswer" type="text" placeholder="Your answer" value={form.securityAnswer} onChange={handleChange} />
            {errors.securityAnswer && <p className="form-error">⚠ {errors.securityAnswer}</p>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" /> Creating account...</> : "Create Account →"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
