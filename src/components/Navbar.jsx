import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // 👈 Added for real-time notifications
import { auth, db } from "../firebase"; // 👈 Assumed db is exported from your firebase configuration
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaSyncAlt,
  FaShoppingCart,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

// ─── Breadcrumb map ──────────────────────────────────────────────────────────
const ROUTE_LABELS = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/finished-goods": "Finished Goods",
  "/customers": "Customers",
  "/orders": "Customer Orders",
  "/vendors": "Vendors",
  "/inward": "Inward Entries",
  "/production-issue": "Production Issue",
  "/dispatch": "Dispatch",
  "/settings": "Settings",
  "/users": "User Management",
};

const NotifIcon = ({ type }) => {
  const map = {
    order: { bg: "bg-indigo-50", text: "text-indigo-500", Icon: FaShoppingCart },
    warning: { bg: "bg-orange-50", text: "text-orange-500", Icon: FaExclamationTriangle },
    success: { bg: "bg-emerald-50", text: "text-emerald-500", Icon: FaCheckCircle },
    users: { bg: "bg-slate-100", text: "text-slate-400", Icon: FaUsers },
  };
  const { bg, text, Icon } = map[type] || map.users;
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}>
      <Icon className="text-sm" />
    </div>
  );
};

// 👈 Removed default hardcoded props to rely on real authentication state
function Navbar({ setIsOpen, userRole = "Administrator" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // 👈 Initialized empty for Firestore stream
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ─── Dynamic User Authentication State ───
  const [currentUser, setCurrentUser] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 1. Listen for real-time Authentication changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Listen for real-time Notifications from Firestore
  useEffect(() => {
    // Queries the 'notifications' collection sorted by execution timestamp
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    
    const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Format timestamp safely if it exists as a Firestore Timestamp type
        time: doc.data().createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Just now"
      }));
      setNotifications(notifList);
    }, (error) => {
      console.error("Error fetching live notifications: ", error);
    });

    return () => unsubscribeNotifs();
  }, []);

  // 3. Handle click outside UI triggers
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── HELPER FUNCTIONS FOR EMAIL TO NAME PARSING ───
  const getUserDisplayDetails = () => {
    const fallbackEmail = "admin@akshayheaters.in";
    const email = currentUser?.email || fallbackEmail;

    // Split before '@' and extract letters only (removing numbers and punctuation marks)
    const handlePart = email.split("@")[0];
    const cleanName = handlePart.replace(/[^a-zA-Z]/g, "");

    // Capitalize the first letter safely
    const formattedName = cleanName 
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) 
      : "User";

    // Generate accurate fallback initials 
    const initials = formattedName.slice(0, 1).toUpperCase();

    return { name: formattedName, email, initials };
  };

  const { name: userName, email: userEmail, initials } = getUserDisplayDetails();

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const pageLabel =
    ROUTE_LABELS[location.pathname.toLowerCase()] ||
    location.pathname.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 shadow-sm md:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 md:hidden"
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="hidden text-slate-400 sm:block">Akshay Heaters</span>
          <span className="hidden text-slate-300 sm:block">/</span>
          <span className="font-semibold text-slate-800">{pageLabel}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Refresh */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          title="Refresh"
          onClick={() => window.location.reload()}
        >
          <FaSyncAlt className="text-sm" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Notifications"
          >
            <FaBell className="text-base" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-6">No notifications found.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${!n.read ? "bg-indigo-50/30" : ""}`}
                      onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {!n.read && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />}
                      </div>
                      <NotifIcon type={n.icon} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                        <p className="text-xs text-slate-500 leading-snug">{n.body}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-50 px-4 py-2.5 text-center">
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-slate-100" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">{userName}</p>
              <p className="text-[11px] leading-tight text-slate-400">{userRole}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
                  <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => { navigate("/settings"); setProfileOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <FaCog className="text-slate-400" />
                  Settings
                </button>
                <button
                  onClick={() => { navigate("/users"); setProfileOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <FaUserCircle className="text-slate-400" />
                    Manage Users
                </button>

                <div className="my-1 h-px bg-slate-100" />

                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  <FaSignOutAlt />
                  {logoutLoading ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;  