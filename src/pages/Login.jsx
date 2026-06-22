import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🌟 HARDCODED ADMIN BYPASS
      // If the email matches your admin credentials, let them pass instantly!
      if (user.email === "admin12345@gmail.com") {
        navigate("/dashboard");
        return; // Stop execution here so it doesn't read Firestore
      }

      // 2. Fetch standard user data from your Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      let userDoc = await getDoc(userDocRef);

      // Safe Fallback for new standard users
      if (!userDoc.exists()) {
        const defaultProfile = {
          uid: user.uid,
          email: user.email,
          name: email.split("@")[0],
          status: "pending",
          role: "employee",
          createdAt: new Date()
        };
        await setDoc(userDocRef, defaultProfile);
        userDoc = await getDoc(userDocRef);
      }

      const userData = userDoc.data();

      // 3. Enforce Admin/Employee system Approval status for regular accounts
      if (userData.status === "pending") {
        await signOut(auth);
        alert("Your account access request is pending Admin approval.");
        return;
      }

      if (userData.status === "rejected") {
        await signOut(auth);
        alert("Access denied. Your system privileges have been revoked.");
        return;
      }

      // 4. Success for normal approved users
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #0a0f1e;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.18;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-1 { width:600px;height:600px;background:radial-gradient(circle,#3b82f6,#6366f1);top:-200px;left:-150px;animation-delay:0s; }
        .blob-2 { width:500px;height:500px;background:radial-gradient(circle,#8b5cf6,#ec4899);bottom:-150px;right:-100px;animation-delay:3s; }
        .blob-3 { width:300px;height:300px;background:radial-gradient(circle,#06b6d4,#3b82f6);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:1.5s; }
        @keyframes blobFloat { 0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.15) translate(30px,-30px)} }

        .grid-overlay {
          position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
          background-size:50px 50px;
        }

        .left-panel { display:none;flex-direction:column;justify-content:center;padding:60px;position:relative;z-index:1; }
        @media(min-width:1024px){ .left-panel{display:flex;flex:1;} }

        .brand-badge {
          display:inline-flex;align-items:center;gap:10px;
          background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);
          border-radius:50px;padding:8px 20px;margin-bottom:40px;width:fit-content;
        }
        .brand-badge-dot { width:8px;height:8px;background:#3b82f6;border-radius:50%;animation:pulse-dot 2s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)} }
        .brand-badge-text { font-size:13px;font-weight:500;color:#93c5fd;letter-spacing:.5px; }

        .left-title { font-size:48px;font-weight:800;line-height:1.15;color:#fff;margin-bottom:20px; }
        .left-title span {
          background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 50%,#ec4899 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .left-desc { font-size:16px;line-height:1.7;color:#94a3b8;max-width:420px;margin-bottom:50px; }

        .stats-row { display:flex;gap:32px; }
        .stat-item { display:flex;flex-direction:column;gap:4px; }
        .stat-value { font-size:28px;font-weight:700;color:#fff; }
        .stat-label { font-size:13px;color:#64748b;font-weight:500; }

        .float-card {
          margin-top:60px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
          border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;
          max-width:360px;backdrop-filter:blur(12px);
          animation:cardFloat 4s ease-in-out infinite alternate;
        }
        @keyframes cardFloat { 0%{transform:translateY(0)}100%{transform:translateY(-10px)} }
        .float-card-icon { width:44px;height:44px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0; }
        .float-card-title { font-size:14px;font-weight:600;color:#e2e8f0; }
        .float-card-sub { font-size:12px;color:#64748b; }

        .right-panel {
          flex:0 0 auto;width:100%;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;z-index:1;
        }
        @media(min-width:1024px){ .right-panel{width:520px;padding:40px;} }

        .form-card {
          width:100%;max-width:440px;
          background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.08);
          border-radius:24px;padding:40px;backdrop-filter:blur(24px);
          box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 25px 60px rgba(0,0,0,.5),0 0 80px rgba(59,130,246,.05);
        }

        .logo-row { display:flex;align-items:center;gap:12px;margin-bottom:32px; }
        .logo-icon { width:44px;height:44px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 8px 24px rgba(59,130,246,.35); }
        .logo-text { font-size:17px;font-weight:700;color:#f1f5f9;letter-spacing:-.3px; }
        .logo-sub { font-size:11px;font-weight:500;color:#475569;letter-spacing:.5px;text-transform:uppercase; }

        .form-title { font-size:26px;font-weight:800;color:#f8fafc;margin-bottom:6px;letter-spacing:-.5px; }
        .form-subtitle { font-size:14px;color:#64748b;margin-bottom:32px; }

        .divider { display:flex;align-items:center;gap:12px;margin-bottom:24px; }
        .divider-line { flex:1;height:1px;background:rgba(255,255,255,0.07); }
        .divider-text { font-size:12px;color:#475569;font-weight:500;white-space:nowrap; }

        .form-group { margin-bottom:20px; }
        .form-label { display:block;font-size:13px;font-weight:600;color:#cbd5e1;margin-bottom:8px;letter-spacing:.2px; }
        .input-wrapper { position:relative;display:flex;align-items:center; }
        .input-icon { position:absolute;left:14px;color:#475569;font-size:15px;pointer-events:none; }

        .form-input {
          width:100%;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);
          border-radius:12px;padding:13px 14px 13px 44px;font-size:14px;font-family:'Inter',sans-serif;
          color:#f1f5f9;outline:none;transition:all .25s ease;
        }
        .form-input::placeholder { color:#334155; }
        .form-input:focus { border-color:#3b82f6;background:rgba(59,130,246,0.06);box-shadow:0 0 0 3px rgba(59,130,246,.15); }

        .password-toggle {
          position:absolute;right:14px;background:none;border:none;cursor:pointer;
          color:#475569;font-size:15px;padding:4px;display:flex;align-items:center;justify-content:center;
          transition:color .2s;border-radius:6px;
        }
        .password-toggle:hover { color:#94a3b8; }

        .submit-btn {
          width:100%;background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);
          border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;
          font-family:'Inter',sans-serif;color:#fff;cursor:pointer;position:relative;overflow:hidden;
          transition:all .25s ease;box-shadow:0 8px 24px rgba(59,130,246,.35);margin-top:8px;letter-spacing:.2px;
        }
        .submit-btn::before {
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);transition:left .5s;
        }
        .submit-btn:hover::before { left:100%; }
        .submit-btn:hover { transform:translateY(-1px);box-shadow:0 12px 32px rgba(59,130,246,.45); }
        .submit-btn:active { transform:translateY(0); }
        .submit-btn:disabled { opacity:.7;cursor:not-allowed;transform:none; }

        .btn-inner { display:flex;align-items:center;justify-content:center;gap:10px; }

        .spinner { width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .form-footer { margin-top:24px;text-align:center;font-size:13.5px;color:#475569; }
        .form-footer a { color:#60a5fa;font-weight:600;text-decoration:none;transition:color .2s; }
        .form-footer a:hover { color:#93c5fd;text-decoration:underline; }

        .security-row { display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px;font-size:11.5px;color:#334155; }
      `}</style>

      <div className="login-root">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="grid-overlay"></div>

        {/* Left decorative panel */}
        <div className="left-panel">
          <div className="brand-badge">
            <div className="brand-badge-dot"></div>
            <span className="brand-badge-text">Enterprise Resource Planning</span>
          </div>

          <h1 className="left-title">
            Manage your<br />
            business with<br />
            <span>precision.</span>
          </h1>

          <p className="left-desc">
            Akshay Heaters ERP centralizes your operations, inventory,
            production, and workforce — all in one powerful platform built
            for modern manufacturing excellence.
          </p>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Uptime SLA</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">256-bit</span>
              <span className="stat-label">Encryption</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">Data Sync</span>
            </div>
          </div>

          <div className="float-card">
            <div className="float-card-icon">🔐</div>
            <div>
              <div className="float-card-title">Role-Based Access Control</div>
              <div className="float-card-sub">Admin · Manager · Employee permissions</div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="right-panel">
          <div className="form-card">

            <div className="logo-row">
              <div className="logo-icon">🔥</div>
              <div>
                <div className="logo-text">Akshay Heaters</div>
                <div className="logo-sub">ERP System</div>
              </div>
            </div>

            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Sign in to access your workspace</p>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">Secure Authentication</span>
              <div className="divider-line"></div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    autoComplete="current-password"
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

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                id="login-submit-btn"
              >
                <div className="btn-inner">
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to ERP</span>
                      <span>→</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <p className="form-footer">
              Don't have access?{" "}
              <Link to="/signup">Request System Access</Link>
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

export default Login;