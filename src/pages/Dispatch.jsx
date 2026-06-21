import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc, updateDoc, Timestamp, arrayUnion, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaSearch, FaTruck, FaUser, FaFileInvoice, FaArrowLeft, FaHistory, FaCalendarAlt, FaCheckCircle, FaClock } from "react-icons/fa";

const Dispatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State for global dashboard mode
  const [allOrders, setAllOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ✅ NEW STATE: Manage active view filter ('pending' vs 'dispatched')
  const [viewFilter, setViewFilter] = useState("pending"); 
  
  // State for single active order item
  const [order, setOrder] = useState(null);
  const [dispatchQty, setDispatchQty] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all orders for search dashboard if NO active ID is selected
  useEffect(() => {
    const fetchAllOrders = async () => {
      if (!id) {
        try {
          setLoading(true);
          const querySnapshot = await getDocs(collection(db, "orders"));
          const ordersList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllOrders(ordersList);
        } catch (err) {
          console.error("Error fetching global orders:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAllOrders();
  }, [id]);

  // 2. Fetch specific order details if an ID IS present in URL
  useEffect(() => {
    const fetchSingleOrder = async () => {
      if (id) {
        try {
          setLoading(true);
          const docRef = doc(db, "orders", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setOrder({ id: docSnap.id, items: data.items || [], ...data });
          }
        } catch (err) {
          console.error("Error fetching single order:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setOrder(null);
      }
    };
    fetchSingleOrder();
  }, [id]);

  const pendingQty = (order?.qty || 0) - (order?.dispatchedQty || 0);

  const recordDispatch = async () => {
    if (!id) return alert("Missing Order ID");
    if (dispatchQty <= 0) return alert("Please enter a valid quantity");
    if (dispatchQty > pendingQty) return alert("Cannot dispatch more than pending quantity!");

    const timestampNow = Timestamp.now();
    const newEntry = {
      qty: Number(dispatchQty),
      date: timestampNow,
    };

    const newTotalDispatched = (order.dispatchedQty || 0) + Number(dispatchQty);
    const updatedStatus = newTotalDispatched >= order.qty ? "Dispatched" : "In Production";

    try {
      // 1. Update order context
      await updateDoc(doc(db, "orders", id), {
        dispatchHistory: arrayUnion(newEntry),
        dispatchedQty: newTotalDispatched,
        status: updatedStatus
      });

      // 2. Create mirror record into global dispatches collection for logs tracking
      await addDoc(collection(db, "dispatches"), {
        dispatchNo: `DSP-WO-${order.woNo || "GEN"}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNo: order.poNo || "N/A",
        woNo: order.woNo || "N/A",
        customer: order.customer || "Unknown Customer",
        product: order.productName || (order.items && order.items[0]?.name) || "Manufactured Goods",
        qtyDispatched: Number(dispatchQty),
        carrierName: "Internal Production Transfer",
        trackingNo: "AUTO-LOGGED",
        dispatchedAt: timestampNow
      });

      alert("Dispatch Recorded Successfully!");
      setDispatchQty(0);
      
      setOrder({
        ...order,
        dispatchedQty: newTotalDispatched,
        status: updatedStatus,
        dispatchHistory: [...(order.dispatchHistory || []), newEntry]
      });
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter items matching layout types and query strings
  const filteredOrders = allOrders.filter(o => {
    const query = searchQuery.toLowerCase();
    
    // ✅ CONDITIONAL GUARD: Filter based on chosen tab layout
    if (viewFilter === "pending") {
      const isPending = o.status === "Pending" || o.status === "In Production" || !o.status;
      if (!isPending) return false;
    } else {
      const isDispatched = o.status === "Dispatched" || o.status === "Completed";
      if (!isDispatched) return false;
    }

    return (
      (o.customer || "").toLowerCase().includes(query) ||
      (o.woNo || "").toLowerCase().includes(query) ||
      (o.poNo || "").toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="p-10 text-center font-medium text-slate-500">Loading Dispatch Dashboard...</div>;

  // --- RENDERING DASHBOARD VIEW ---
  if (!id) {
    return (
      <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaTruck className="text-indigo-600" /> Dispatch Registry Center
          </h1>
          <p className="text-slate-500 text-sm">Search and pick an active manufacturing work order to dispatch stock entries.</p>
        </div>

        {/* ✅ TAB SELECTOR BAR */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setViewFilter("pending")}
            className={`pb-3 pt-2 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              viewFilter === "pending"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FaClock className="text-xs" /> Pending / In Production
          </button>
          <button
            onClick={() => setViewFilter("dispatched")}
            className={`pb-3 pt-2 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              viewFilter === "dispatched"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FaCheckCircle className="text-xs" /> Dispatched / Completed
          </button>
        </div>

        {/* SEARCH BAR CONTAINER */}
        <div className="relative mb-6 max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FaSearch />
          </span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            placeholder="Search by customer name, WO sequence, or PO number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ORDERS SELECTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((o) => {
              const remaining = (o.qty || 0) - (o.dispatchedQty || 0);
              return (
                <div 
                  key={o.id} 
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-[11px] font-bold tracking-wider uppercase text-slate-600 px-2.5 py-1 rounded-md">
                      WO: {o.woNo || "N/A"}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${remaining <= 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {remaining <= 0 ? 'Fully Dispatched' : `${remaining} Items Pending`}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                    <FaUser className="text-xs text-slate-400" /> {o.customer || "Unknown Customer"}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                    <FaFileInvoice /> PO: {o.poNo || "-"}
                  </p>

                  <div className="grid grid-cols-2 border-t pt-3 text-xs text-slate-500">
                    <div>Ordered: <strong className="text-slate-800 font-semibold">{o.qty || 0}</strong></div>
                    <div className="text-right">Dispatched: <strong className="text-green-600 font-semibold">{o.dispatchedQty || 0}</strong></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
              No matching processing records found for this category.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERING DETAIL VIEW (When an order is selected) ---
  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/dispatch")}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-black font-semibold text-xs tracking-wider uppercase transition-colors"
      >
        <FaArrowLeft /> BACK TO DISPATCH REGISTRY
      </button>

      {/* ORDER CONTEXT HEADER */}
      <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">Live Tracking Component</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Dispatch Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Order Sequence: <strong className="text-slate-800">{order.woNo || "-"}</strong> &bull; Customer Entity: <strong className="text-slate-800">{order.customer || "-"}</strong>
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
          order.status === "Pending" ? "bg-amber-100 text-amber-700" :
          order.status === "In Production" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
        }`}>
          {order.status || "Pending"}
        </span>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Quantity Ordered</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{(order.qty || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accumulated Dispatched</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{(order.dispatchedQty || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining Outstanding Balance</p>
          <p className="text-2xl sm:text-3xl font-black text-orange-600 mt-1">{pendingQty.toLocaleString()}</p>
        </div>
      </div>
      
      {/* INPUT ENTRY FORM PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wider mb-4">Record New Partial/Full Outward Delivery</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <input 
              type="number" 
              className="w-full border border-slate-200 p-3.5 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" 
              placeholder="Enter item delivery count" 
              value={dispatchQty === 0 ? "" : dispatchQty}
              onChange={e => setDispatchQty(e.target.value)} 
            />
          </div>
          <button 
            onClick={recordDispatch} 
            disabled={pendingQty <= 0}
            className="bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-indigo-100 disabled:shadow-none transition-all text-sm active:scale-98"
          >
            {pendingQty <= 0 ? "Fully Dispatched" : "Confirm Delivery Entry"}
          </button>
        </div>
      </div>

      {/* MODERN ENHANCED HISTORY LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <FaHistory className="text-slate-400 text-sm" />
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Historical Order Outward Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Log Index No.</th>
                <th className="p-4 flex items-center gap-1.5"><FaCalendarAlt /> Outward Delivery Date & Time</th>
                <th className="p-4 text-right pr-6">Dispatched Quantity Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.dispatchHistory || []).length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-slate-400 text-sm italic">
                    No outbound delivery entries recorded for this manufacture track run yet.
                  </td>
                </tr>
              ) : (
                [...(order.dispatchHistory || [])].reverse().map((h, i, arr) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 pl-6 text-xs text-slate-400 font-mono font-semibold">
                      #{(arr.length - i).toString().padStart(2, '0')}
                    </td>
                    <td className="p-4 text-sm text-slate-700 font-medium">
                      {h.date?.toDate ? (
                        <div className="flex flex-col sm:flex-row sm:gap-2">
                          <span className="text-slate-900 font-semibold">{h.date.toDate().toLocaleDateString("en-IN")}</span>
                          <span className="text-slate-400 text-xs mt-0.5">{h.date.toDate().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Timestamp Corrupted</span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6 font-bold text-emerald-600 text-sm font-mono">
                      +{h.qty?.toLocaleString()} units
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
};

export default Dispatch;