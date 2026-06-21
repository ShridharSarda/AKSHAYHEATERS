import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaClock,
  FaBoxes,
  FaIndustry,
  FaArrowDown,
  FaTruck,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";

const palette = {
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  indigo: "bg-indigo-50 text-indigo-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-500",
};

function StatCard({ title, value, icon, color = "slate", loading, alert, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md active:translate-y-0"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-2.5 h-7 w-14 animate-pulse rounded-md bg-slate-200" />
          ) : (
            <h2
              className={`mt-1.5 text-2xl font-bold tabular-nums md:text-3xl ${
                alert ? "text-rose-600" : "text-slate-800"
              }`}
            >
              {value}
            </h2>
          )}
        </div>
        <div
          className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg ${palette[color]}`}
        >
          {icon}
          {alert && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </div>
      </div>
    </div>
  );
}

const statusStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  "In Production": "border-sky-200 bg-sky-50 text-sky-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Dispatched: "border-gray-200 bg-gray-50 text-gray-700",
};

const statusDot = {
  Pending: "bg-amber-500",
  "In Production": "bg-sky-500",
  Completed: "bg-emerald-500",
  Dispatched: "bg-gray-500",
};

function Dashboard() {
  const navigate = useNavigate();

  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [rawMaterialsCount, setRawMaterialsCount] = useState(0);
  const [finishedGoodsCount, setFinishedGoodsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [productionIssuesCount, setProductionIssuesCount] = useState(0);
  
  // States for Today's Inward and Dispatch metrics
  const [todaysInwardCount, setTodaysInwardCount] = useState(0);
  const [todaysDispatchCount, setTodaysDispatchCount] = useState(0);
  
  // ✅ NEW STATE: Store recent orders pulled dynamically from Firestore
  const [fetchedRecentOrders, setFetchedRecentOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);

      // Define date ranges for today's dynamic metrics
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // --- 1. Fetch Orders Metrics & Dynamic Recent Orders ---
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      let ordersTotal = 0;
      let ordersPending = 0;
      const allOrdersList = [];

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        ordersTotal++;
        if (data.status === "Pending" || data.status === "In Production") {
          ordersPending++;
        }
        
        // Accumulate details for recent order history layout matching fields safely
        allOrdersList.push({
          id: doc.id,
          wo: data.woNo || "N/A",
          customer: data.customer || "Unknown Customer",
          product: data.productName || (data.items && data.items[0]?.name) || "Manufactured Goods",
          qty: Number(data.qty || 0),
          status: data.status || "Pending",
          createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0) // Safe fallback for sorting
        });
      });

      // Sort recent orders descending by creation timestamp and limit view list to top 5
      const sortedRecent = allOrdersList
        .sort((a, b) => b.createdAtDate - a.createdAtDate)
        .slice(0, 3);
      
      setFetchedRecentOrders(sortedRecent);

      // --- 2. Fetch Inventory Metrics ---
      const inventorySnapshot = await getDocs(collection(db, "inventory"));
      let rawCount = 0;
      let finishedCount = 0;
      let lowStock = 0;

      inventorySnapshot.forEach((doc) => {
        const data = doc.data();
        const itemType = data.itemType || "Raw Material";
        const currentStock = Number(data.stock ?? data.quantity ?? 0);
        const minStock = Number(data.minimumStock || 0);

        if (itemType === "Raw Material") rawCount++;
        else if (itemType === "Finished Good") finishedCount++;
        if (currentStock < minStock) lowStock++;
      });

      // --- 3. FETCH TODAY'S PRODUCTION ISSUES COUNT ---
      const issuesSnapshot = await getDocs(collection(db, "production_issues"));
      let dailyIssueCount = 0;

      issuesSnapshot.forEach((doc) => {
        const timestamp = doc.data().createdAt?.toDate();
        if (timestamp && timestamp >= startOfDay && timestamp <= endOfDay) {
          dailyIssueCount++;
        }
      });

      // --- 4. FETCH TODAY'S INWARD COUNT ---
      const inwardSnapshot = await getDocs(collection(db, "inwards"));
      let dailyInwardCount = 0;

      inwardSnapshot.forEach((doc) => {
        const timestamp = (doc.data().createdAt || doc.data().date)?.toDate();
        if (timestamp && timestamp >= startOfDay && timestamp <= endOfDay) {
          dailyInwardCount++;
        }
      });

      // --- 5. FETCH TODAY'S DISPATCH COUNT ---
      const dispatchSnapshot = await getDocs(collection(db, "dispatches"));
      let dailyDispatchCount = 0;

      dispatchSnapshot.forEach((doc) => {
        const data = doc.data();
        const rawTimestamp = data.dispatchedAt || data.createdAt || data.date;
        const recordDate = rawTimestamp?.toDate 
          ? rawTimestamp.toDate() 
          : (rawTimestamp ? new Date(rawTimestamp) : null);

        if (recordDate && recordDate >= startOfDay && recordDate <= endOfDay) {
          dailyDispatchCount++;
        }
      });

      // Update states
      setTotalOrdersCount(ordersTotal);
      setPendingOrdersCount(ordersPending);
      setRawMaterialsCount(rawCount);
      setFinishedGoodsCount(finishedCount);
      setLowStockCount(lowStock);
      setProductionIssuesCount(dailyIssueCount);
      setTodaysInwardCount(dailyInwardCount);
      setTodaysDispatchCount(dailyDispatchCount);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const topCards = [
    { 
      title: "Total Orders", 
      value: totalOrdersCount, 
      icon: <FaShoppingCart />, 
      color: "violet",
      loading,
      onClick: () => navigate("/orders")
    },
    { 
      title: "Pending Orders", 
      value: pendingOrdersCount, 
      icon: <FaClock />, 
      color: "amber",
      loading,
      onClick: () => navigate("/order-pending", { state: { filterActiveWorkflows: true } }) 
    },
    {
      title: "Raw Materials",
      value: rawMaterialsCount,
      icon: <FaBoxes />,
      color: "emerald",
      loading,
      onClick: () => navigate("/Products", { state: { defaultCategory: "Raw Material" } }),
    },
    {
      title: "Finished Goods",
      value: finishedGoodsCount,
      icon: <FaIndustry />,
      color: "sky",
      loading,
      onClick: () => navigate("/finished-goods", { state: { defaultCategory: "Finished Good" } }),
    },
  ];

  const overviewCards = [
    { 
      title: "Today's Inward", 
      value: todaysInwardCount, 
      icon: <FaArrowDown />, 
      color: "sky",
      loading,
      onClick: () => navigate("/inwards")
    },
    { 
      title: "Today's Dispatch", 
      value: todaysDispatchCount, 
      icon: <FaTruck />, 
      color: "indigo",
      loading,
      onClick: () => navigate("/dispatches")
    },
    { 
      title: "Production Issues", 
      value: productionIssuesCount, 
      icon: <FaExclamationTriangle />, 
      color: "amber",
      loading,
      onClick: () => navigate("/todays-production-issues"),
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      icon: <FaBoxes />,
      color: lowStockCount > 0 ? "rose" : "slate",
      alert: lowStockCount > 0,
      loading,
      onClick: () => navigate("/Products", { state: { showLowStockOnly: true } }),
    },
  ];

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-slate-800 md:text-xl">Today's Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-800 md:text-xl">Recent Orders</h2>
          <button onClick={() => navigate("/orders")} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">WO No</th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 animate-pulse font-medium">
                    Fetching latest workflow sequences...
                  </td>
                </tr>
              ) : fetchedRecentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                    No order records found in the database.
                  </td>
                </tr>
              ) : (
                fetchedRecentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                  >
                    <td className="p-3.5 font-medium text-slate-900">{order.wo}</td>
                    <td className="p-3.5">{order.customer}</td>
                    <td className="p-3.5">{order.product}</td>
                    <td className="p-3.5 font-semibold tabular-nums">{order.qty.toLocaleString("en-IN")}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status] || "bg-slate-500"}`} />
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;