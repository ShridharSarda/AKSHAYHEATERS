import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time fetch of all users from Firestore
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Action Handlers
  const handleStatusChange = async (userId, newStatus, assignedRole = 'employee') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
        role: assignedRole
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (window.confirm("Are you sure you want to revoke system access for this user?")) {
      try {
        const userRef = doc(db, 'users', userId);
        // Either delete the document or mark status as 'rejected'
        await updateDoc(userRef, { status: 'rejected' }); 
      } catch (error) {
        console.error("Error revoking access:", error);
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading user management console...</div>;
  }

  // Filter users into Pending vs Active lists
  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'approved');

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">User Access Management</h1>
        <p className="text-gray-500 text-sm">Control who can access Akshay Heaters ERP and assign system privileges.</p>
      </div>

      {/* --- SECTION 1: PENDING APPROVALS --- */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
          <h2 className="font-semibold text-amber-800 flex items-center gap-2">
            ⚠️ Pending Approvals ({pendingUsers.length})
          </h2>
        </div>
        {pendingUsers.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm italic">No new access requests pending.</p>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pendingUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleStatusChange(user.id, 'approved', 'employee')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                      Approve Staff
                    </button>
                    <button 
                      onClick={() => handleStatusChange(user.id, 'approved', 'admin')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                      Approve Admin
                    </button>
                    <button 
                      onClick={() => handleStatusChange(user.id, 'rejected')}
                      className="text-red-600 hover:text-red-800 px-3 py-1.5 text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- SECTION 2: ACTIVE USERS --- */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">👥 Active System Users ({activeUsers.length})</h2>
        </div>
        {activeUsers.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm italic">No approved users in system.</p>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role Privilege</th>
                <th className="px-6 py-3 text-right">Access Management</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role || 'employee'} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-gray-50 border border-gray-300 rounded p-1 text-xs font-medium text-gray-700 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="employee">Employee / Staff</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRevokeAccess(user.id)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline transition"
                    >
                      Revoke Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}