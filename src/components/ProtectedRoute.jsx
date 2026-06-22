import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // Adjust paths as necessary

function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 🌟 HARDCODED ADMIN CHECK
        // If this specific user logs in, automatically treat them as an approved admin
        if (currentUser.email === "admin12345@gmail.com") {
          setUserData({
            status: "approved",
            role: "admin",
            email: currentUser.email
          });
          setLoading(false);
          return;
        }

        try {
          // Standard check for all other regular users
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Wait for Auth and DB loading states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">
        Verifying system access privileges...
      </div>
    );
  }

  // 2. If not logged in, boot to login screen
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. For any other account, check if approved
  if (!userData || userData.status !== "approved") {
    alert("Access Denied: Your account is either pending approval or has been revoked.");
    return <Navigate to="/" replace />;
  }

  // 4. Protect admin routes from non-admin users
  if (requireAdmin && userData.role !== "admin") {
    alert("Access Denied: Admin privileges required.");
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Success!
  return children;
}

export default ProtectedRoute;