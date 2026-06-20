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
};

const statusDot = {
  Pending: "bg-amber-500",
  "In Production": "bg-sky-500",
  Completed: "bg-emerald-500",
};

const recentOrders = [
  { wo: "WO-310", customer: "Kumar Elastomech", product: "MBH", qty: 7000, status: "Pending" },
  { wo: "WO-311", customer: "Varroc", product: "Mica Board", qty: 3000, status: "In Production" },
];

function Dashboard() {
  const navigate = useNavigate();

  // Real-time metric states calculated from live Firestore data
  const [rawMaterialsCount, setRawMaterialsCount] = useState(0);
  const [finishedGoodsCount, setFinishedGoodsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
  try {
    setLoading(true);

    // Query the unified 'inventory' collection just like Products.js does
    const inventorySnapshot = await getDocs(collection(db, "inventory"));
    
    let rawCount = 0;
    let finishedCount = 0;
    let lowStock = 0;

    inventorySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const itemType = data.itemType || "Raw Material";
      const currentStock = Number(data.stock ?? data.quantity ?? 0);
      const minStock = Number(data.minimumStock || 0);

      // 1. Increment type-specific global metrics
      if (itemType === "Raw Material") {
        rawCount++;
      } else if (itemType === "Finished Good") {
        finishedCount++;
      }

      // 2. Compute low stock flag matching your custom Products page filter
      if (currentStock < minStock) {
        lowStock++;
      }
    });

    setRawMaterialsCount(rawCount);
    setFinishedGoodsCount(finishedCount);
    setLowStockCount(lowStock);
  } catch (error) {
    console.error("Error fetching dashboard statistics from Firestore:", error);
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
    { title: "Total Orders", value: 128, icon: <FaShoppingCart />, color: "violet" },
    { title: "Pending Orders", value: 24, icon: <FaClock />, color: "amber" },
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
      onClick: () => navigate("/Products", { state: { defaultCategory: "Finished Good" } }),
    },
  ];

  const overviewCards = [
    { title: "Today's Inward", value: 12, icon: <FaArrowDown />, color: "sky" },
    { title: "Today's Dispatch", value: 5, icon: <FaTruck />, color: "indigo" },
    { title: "Production Issues", value: 8, icon: <FaExclamationTriangle />, color: "amber" },
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
      {/* Header */}
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

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Today's Overview */}
      <h2 className="mb-4 mt-8 text-lg font-bold text-slate-800 md:text-xl">Today's Overview</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-800 md:text-xl">Recent Orders</h2>
          <button
            onClick={() => navigate("/orders")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  WO No
                </th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product
                </th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Qty
                </th>
                <th className="p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.map((order) => (
                <tr key={order.wo} className="transition-colors hover:bg-slate-50/70">
                  <td className="p-3.5 font-medium text-slate-900">{order.wo}</td>
                  <td className="p-3.5">{order.customer}</td>
                  <td className="p-3.5">{order.product}</td>
                  <td className="p-3.5 font-semibold tabular-nums">{order.qty.toLocaleString("en-IN")}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status]}`} />
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;