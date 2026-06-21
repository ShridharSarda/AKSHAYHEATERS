import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // 👈 1. Crucial for catching the dashboard click state
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👈 2. Read the boolean flag we passed from Dashboard top cards
  const filterActiveWorkflows = location.state?.filterActiveWorkflows || false;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrdersList(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // 👈 3. THIS IS THE FILTERING STEP: Checks if coming from dashboard click
  const displayedOrders = ordersList.filter(order => {
    if (filterActiveWorkflows) {
      // Returns true ONLY if order is 'Pending' or 'In Production'
      return order.status === "Pending" || order.status === "In Production";
    }
    return true; // Returns everything if accessed via standard navbar
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading orders...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {filterActiveWorkflows ? "Active Processing Queue" : "Order Registry Master Log"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {filterActiveWorkflows 
            ? "Showing strictly items currently Pending or In Production." 
            : "Displaying complete record historical data entries."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b">
            <tr>
              <th className="p-4 pl-6">WO No</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Product</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* 👈 4. CRITICAL: Change from ordersList.map to displayedOrders.map */}
            {displayedOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-slate-400 italic">No matching orders found.</td>
              </tr>
            ) : (
              displayedOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => navigate(`/order-details/${order.id}`)} 
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="p-4 pl-6 font-mono font-bold text-slate-900">{order.woNo || "N/A"}</td>
                  <td className="p-4 font-medium text-slate-700">{order.customer || "-"}</td>
                  <td className="p-4 text-slate-600">{order.product || "-"}</td>
                  <td className="p-4 font-semibold">{order.qty || 0}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      order.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      order.status === "In Production" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {order.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;