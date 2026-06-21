import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaSearch, FaPlus, FaTimes, FaTruck, FaUser, FaBuilding, FaFileInvoice, FaHashtag, FaSortNumericUp 
} from "react-icons/fa";

const Dispatches = () => {
  const [dispatches, setDispatches] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ Added loading state tracker
  const [newDispatch, setNewDispatch] = useState({
    dispatchNo: "", invoiceNo: "", woNo: "", customer: "", product: "", qtyDispatched: "", carrierName: "", trackingNo: ""
  });

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "dispatches"), orderBy("dispatchedAt", "desc"));
      const snapshot = await getDocs(q);
      setDispatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching dispatches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDispatches(); 
  }, []);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA'); 

    const result = dispatches.filter(d => {
      const recordDate = d.dispatchedAt?.toDate 
        ? d.dispatchedAt.toDate() 
        : (d.createdAt?.toDate ? d.createdAt.toDate() : null);
      
      const finalDate = recordDate || (d.dispatchedAt ? new Date(d.dispatchedAt) : null);

      const matchesSearch = 
        (d.customer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.woNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.invoiceNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.product || "").toLowerCase().includes(searchTerm.toLowerCase());

      // If user typed a search phrase, look through ALL historic records instead of hiding them
      if (searchTerm !== "") {
        return matchesSearch;
      }

      // 3. Filter for Today's logs
      if (finalDate) {
        const recordStr = finalDate.toLocaleDateString('en-CA');
        if (recordStr === todayStr) {
          return matchesSearch;
        }
      }
      
      return false;
    });

    // ✅ RECOVERY FALLBACK: If nothing happened today, show the last 15 historical items instead of an empty screen
    if (result.length === 0 && searchTerm === "" && dispatches.length > 0) {
      setFilteredDispatches(dispatches.slice(0, 15));
    } else {
      setFilteredDispatches(result);
    }
  }, [searchTerm, dispatches]);

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "dispatches"), {
        ...newDispatch,
        qtyDispatched: Number(newDispatch.qtyDispatched),
        dispatchedAt: Timestamp.now()
      });
      setShowForm(false);
      setNewDispatch({ dispatchNo: "", invoiceNo: "", woNo: "", customer: "", product: "", qtyDispatched: "", carrierName: "", trackingNo: "" });
      fetchDispatches();
    } catch (err) {
      alert("Error adding dispatch record: " + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Material Dispatch Logs</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track outgoing shipments, customer orders, and dispatch records.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 font-semibold text-sm sm:text-base"
        >
          <FaPlus /> New Manual Dispatch
        </button>
      </div>

      {/* Filter Search Deck */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1 group">
          <FaSearch className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="Search by Customer, WO Number, PO/Invoice, or Product..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Layout Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Time / Date</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">WO Number</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Customer Name</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Product Item</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Qty Dispatched</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">PO/Invoice Ref No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 animate-pulse font-medium">Fetching dispatch pipeline records...</td>
                </tr>
              ) : filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 italic">No dispatch entries recorded matching criteria.</td>
                </tr>
              ) : (
                filteredDispatches.map(d => {
                  const finalDate = d.dispatchedAt?.toDate ? d.dispatchedAt.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5 text-sm text-slate-600 font-medium">
                        {finalDate ? (
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-semibold">{finalDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-slate-400 text-xs">{finalDate.toLocaleDateString("en-IN")}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-5"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">{d.woNo || "—"}</span></td>
                      <td className="p-5 text-sm font-semibold text-slate-800">{d.customer || "N/A"}</td>
                      <td className="p-5 text-sm text-slate-700 font-medium">{d.product || "—"}</td>
                      <td className="p-5 text-sm font-bold text-emerald-600 text-center">{(d.qtyDispatched || 0).toLocaleString()} Units</td>
                      <td className="p-5 text-sm text-slate-500 font-mono font-semibold">{d.invoiceNo || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse font-medium text-sm">Fetching dispatch pipeline records...</div>
          ) : filteredDispatches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">No dispatch entries recorded matching criteria.</div>
          ) : (
            filteredDispatches.map(d => {
              const finalDate = d.dispatchedAt?.toDate ? d.dispatchedAt.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null);
              return (
                <div key={d.id} className="p-4 space-y-3 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">
                      {finalDate ? `${finalDate.toLocaleDateString("en-IN")} ${finalDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}` : "—"}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold">WO: {d.woNo}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{d.product}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Customer: <span className="font-semibold text-slate-700">{d.customer}</span></p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">PO Ref: {d.invoiceNo || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Dispatched Quantity</span>
                    <span className="font-bold text-emerald-600 text-sm">{(d.qtyDispatched || 0).toLocaleString()} Units</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Entry Overlay Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-50 p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Create Manual Dispatch Entry</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Manually insert outbound shipments without referencing live work orders.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="bg-white p-2.5 rounded-2xl text-slate-400 border border-slate-200"><FaTimes /></button>
            </div>

            <form onSubmit={handleCreateDispatch} className="p-5 sm:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Work Order (WO) No</label>
                  <div className="relative">
                    <FaHashtag className="absolute left-4 top-3.5 text-slate-300" />
                    <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="e.g. WO-5502" required onChange={e => setNewDispatch({ ...newDispatch, woNo: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">PO / Invoice Number</label>
                  <div className="relative">
                    <FaFileInvoice className="absolute left-4 top-3.5 text-slate-300" />
                    <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="e.g. PO-8902" required onChange={e => setNewDispatch({ ...newDispatch, invoiceNo: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer Corporate Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-3.5 text-slate-300" />
                    <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Enter customer entity" required onChange={e => setNewDispatch({ ...newDispatch, customer: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Product Description</label>
                  <div className="relative">
                    <FaTruck className="absolute left-4 top-3.5 text-slate-300" />
                    <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Item Name or Assembly No." required onChange={e => setNewDispatch({ ...newDispatch, product: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Quantity Dispatched</label>
                  <div className="relative">
                    <FaSortNumericUp className="absolute left-4 top-3.5 text-slate-300" />
                    <input type="number" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" placeholder="0" required onChange={e => setNewDispatch({ ...newDispatch, qtyDispatched: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="w-full sm:flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm order-2 sm:order-1">Cancel</button>
                <button type="submit" className="w-full sm:flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 order-1 sm:order-2">Save Log Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispatches;