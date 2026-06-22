import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create matching profile document in Firestore with 'pending' status
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: "employee",  // Default role assigned
        status: "pending", // Locked until Admin approves
        createdAt: new Date()
      });

      // 3. Force sign out immediately so they don't auto-login into protected routes
      await signOut(auth);

      alert("Registration successful! Your request has been sent to the Admin for approval.");
      navigate("/"); // Redirect back to Login screen
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .signup-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #0a0f1e;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        /* ── Blobs ── */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.18;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-1 { width:600px;height:600px;background:radial-gradient(circle,#8b5cf6,#6366f1);top:-200px;right:-150px;animation-delay:0s; }
        .blob-2 { width:500px;height:500px;background:radial-gradient(circle,#3b82f6,#06b6d4);bottom:-150px;left:-100px;animation-delay:3s; }
        .blob-3 { width:280px;height:280px;background:radial-gradient(circle,#ec4899,#8b5cf6);top:40%;left:40%;animation-delay:1.5s; }
        @keyframes blobFloat { 0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.15) translate(20px,-25px)} }

        .grid-overlay {
          position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
          background-size:50px 50px;
        }

        /* ── Left panel ── */
        .left-panel { display:none;flex-direction:column;justify-content:center;padding:60px;position:relative;z-index:1; }
        @media(min-width:1024px){ .left-panel{display:flex;flex:1;} }

        .brand-badge {
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);
          border-radius:50px;padding:8px 20px;margin-bottom:40px;width:fit-content;
        }
        .brand-badge-dot { width:8px;height:8px;background:#8b5cf6;border-radius:50%;animation:pulse-dot 2s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)} }
        .brand-badge-text { font-size:13px;font-weight:500;color:#c4b5fd;letter-spacing:.5px; }

        .left-title { font-size:44px;font-weight:800;line-height:1.2;color:#fff;margin-bottom:20px; }
        .left-title span {
          background:linear-gradient(135deg,#8b5cf6 0%,#3b82f6 50%,#06b6d4 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .left-desc { font-size:15px;line-height:1.7;color:#94a3b8;max-width:400px;margin-bottom:44px; }

        /* steps */
        .steps-list { display:flex;flex-direction:column;gap:16px;margin-bottom:48px; }
        .step-item {
          display:flex;align-items:flex-start;gap:16px;
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:16px 20px;
          transition:border-color .3s,background .3s;
        }
        .step-item:hover { background:rgba(255,255,255,0.07);border-color:rgba(139,92,246,0.25); }
        .step-number {
          width:32px;height:32px;border-radius:50%;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;
        }
        .step-number-1 { background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff; }
        .step-number-2 { background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff; }
        .step-number-3 { background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff; }
        .step-text { display:flex;flex-direction:column;gap:3px; }
        .step-title { font-size:13.5px;font-weight:600;color:#e2e8f0; }
        .step-desc  { font-size:12px;color:#64748b; }

        /* ── Right panel ── */
        .right-panel {
          flex:0 0 auto;width:100%;display:flex;align-items:center;justify-content:center;
          padding:24px;position:relative;z-index:1;
        }
        @media(min-width:1024px){ .right-panel{width:540px;padding:40px;overflow-y:auto;} }

        .form-card {
          width:100%;max-width:460px;
          background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.08);
          border-radius:24px;padding:40px;backdrop-filter:blur(24px);
          box-shadow:0 0 0 1px rgba(255,255,255,0.04),0 25px 60px rgba(0,0,0,.55),0 0 80px rgba(139,92,246,.05);
        }

        .logo-row { display:flex;align-items:center;gap:12px;margin-bottom:28px; }
        .logo-icon {
          width:44px;height:44px;
          background:linear-gradient(135deg,#8b5cf6,#6366f1);
          border-radius:12px;display:flex;align-items:center;justify-content:center;
          font-size:20px;box-shadow:0 8px 24px rgba(139,92,246,.35);
        }
        .logo-text { font-size:17px;font-weight:700;color:#f1f5f9;letter-spacing:-.3px; }
        .logo-sub  { font-size:11px;font-weight:500;color:#475569;letter-spacing:.5px;text-transform:uppercase; }

        .form-title    { font-size:24px;font-weight:800;color:#f8fafc;margin-bottom:6px;letter-spacing:-.5px; }
        .form-subtitle { font-size:13.5px;color:#64748b;margin-bottom:28px; }

        .divider { display:flex;align-items:center;gap:12px;margin-bottom:22px; }
        .divider-line { flex:1;height:1px;background:rgba(255,255,255,0.07); }
        .divider-text { font-size:12px;color:#475569;font-weight:500;white-space:nowrap; }

        /* two-column grid for name + email on wider screens */
        .form-grid { display:grid;gap:16px;margin-bottom:0; }
        @media(min-width:480px){ .form-grid{ grid-template-columns:1fr 1fr; } }

        .form-group { margin-bottom:16px; }
        .form-label { display:block;font-size:13px;font-weight:600;color:#cbd5e1;margin-bottom:7px;letter-spacing:.2px; }

        .input-wrapper { position:relative;display:flex;align-items:center; }
        .input-icon { position:absolute;left:14px;font-size:15px;pointer-events:none; }

        .form-input {
          width:100%;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);
          border-radius:12px;padding:12px 14px 12px 44px;font-size:14px;font-family:'Inter',sans-serif;
          color:#f1f5f9;outline:none;transition:all .25s ease;
        }
        .form-input::placeholder { color:#334155; }
        .form-input:focus { border-color:#8b5cf6;background:rgba(139,92,246,0.06);box-shadow:0 0 0 3px rgba(139,92,246,.15); }
        .form-input.error { border-color:#f43f5e;background:rgba(244,63,94,0.05); }
        .form-input.error:focus { box-shadow:0 0 0 3px rgba(244,63,94,.15); }

        .password-toggle {
          position:absolute;right:12px;background:none;border:none;cursor:pointer;
          color:#475569;font-size:15px;padding:4px;display:flex;align-items:center;justify-content:center;
          transition:color .2s;border-radius:6px;
        }
        .password-toggle:hover { color:#94a3b8; }

        .error-msg { font-size:12px;color:#f43f5e;margin-top:6px;display:flex;align-items:center;gap:5px; }

        /* pending info box */
        .info-box {
          display:flex;align-items:flex-start;gap:12px;
          background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);
          border-radius:12px;padding:14px 16px;margin-bottom:20px;
        }
        .info-box-icon { font-size:16px;flex-shrink:0;margin-top:1px; }
        .info-box-text { font-size:12.5px;color:#a78bfa;line-height:1.6; }

        /* submit */
        .submit-btn {
          width:100%;background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);
          border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;
          font-family:'Inter',sans-serif;color:#fff;cursor:pointer;position:relative;overflow:hidden;
          transition:all .25s ease;box-shadow:0 8px 24px rgba(139,92,246,.35);margin-top:4px;
        }
        .submit-btn::before {
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);transition:left .5s;
        }
        .submit-btn:hover::before { left:100%; }
        .submit-btn:hover { transform:translateY(-1px);box-shadow:0 12px 32px rgba(139,92,246,.45); }
        .submit-btn:active { transform:translateY(0); }
        .submit-btn:disabled { opacity:.65;cursor:not-allowed;transform:none; }

        .btn-inner { display:flex;align-items:center;justify-content:center;gap:10px; }

        .spinner { width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .form-footer { margin-top:22px;text-align:center;font-size:13.5px;color:#475569; }
        .form-footer a { color:#a78bfa;font-weight:600;text-decoration:none;transition:color .2s; }
        .form-footer a:hover { color:#c4b5fd;text-decoration:underline; }

        .security-row { display:flex;align-items:center;justify-content:center;gap:6px;margin-top:18px;font-size:11.5px;color:#334155; }
      `}</style>

      <div className="signup-root">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="grid-overlay"></div>

        {/* ── Left decorative panel ── */}
        <div className="left-panel">
          <div className="brand-badge">
            <div className="brand-badge-dot"></div>
            <span className="brand-badge-text">Access Request Portal</span>
          </div>

          <h1 className="left-title">
            Join the<br />
            Akshay Heaters<br />
            <span>ERP Platform.</span>
          </h1>

          <p className="left-desc">
            Submit your access request and get onboarded to the enterprise
            system. All accounts are reviewed and approved by the system admin
            before access is granted.
          </p>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number step-number-1">1</div>
              <div className="step-text">
                <span className="step-title">Register Your Details</span>
                <span className="step-desc">Fill in your name, email and set a secure password</span>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number step-number-2">2</div>
              <div className="step-text">
                <span className="step-title">Admin Review & Approval</span>
                <span className="step-desc">Your request is sent to the system administrator for verification</span>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number step-number-3">3</div>
              <div className="step-text">
                <span className="step-title">Access Granted</span>
                <span className="step-desc">Once approved, sign in and start using the ERP platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="right-panel">
          <div className="form-card">

            <div className="logo-row">
              <div className="logo-icon">🔥</div>
              <div>
                <div className="logo-text">Akshay Heaters</div>
                <div className="logo-sub">ERP System</div>
              </div>
            </div>

            <h2 className="form-title">Request System Access</h2>
            <p className="form-subtitle">Create your account — pending admin approval</p>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">New Employee Registration</span>
              <div className="divider-line"></div>
            </div>

            <div className="info-box">
              <span className="info-box-icon">ℹ️</span>
              <span className="info-box-text">
                Your account will be created with <strong>pending</strong> status. You will only be able to sign in after an administrator approves your request.
              </span>
            </div>

            <form onSubmit={handleSignup}>

              {/* Name + Email row */}
              <div className="form-grid" style={{ marginBottom: "16px" }}>
                <div>
                  <label htmlFor="fullname" className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      id="fullname"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="form-input"
                      autoComplete="name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      type="email"
                      id="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="form-input"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    autoComplete="new-password"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔑</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`form-input${passwordMismatch ? " error" : ""}`}
                    autoComplete="new-password"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordMismatch && (
                  <div className="error-msg">
                    <span>⚠️</span>
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading || passwordMismatch}
                id="signup-submit-btn"
              >
                <div className="btn-inner">
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Submitting Request…</span>
                    </>
                  ) : (
                    <>
                      <span>Register Access Request</span>
                      <span>→</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <p className="form-footer">
              Already have an account?{" "}
              <Link to="/">Sign in here</Link>
            </p>

            <div className="security-row">
              <span>🛡️</span>
              <span>Protected by Firebase Authentication · SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;