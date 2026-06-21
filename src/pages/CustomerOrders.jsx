import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
    FaSearch, FaPlus, FaTimes, FaEdit, FaTrash,
    FaFileInvoice, FaUser, FaBoxOpen, FaSortNumericUp, FaHashtag
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate(); // Add this line
    const [newOrder, setNewOrder] = useState({
        woNo: "", customer: "", product: "", qty: "", poNo: "", status: "Pending"
    });
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            try {
                await deleteDoc(doc(db, "orders", id));
                // Refresh the list after deletion
                fetchOrders();
            } catch (err) {
                alert("Error deleting order: " + err.message);
            }
        }
    };

    const fetchOrders = async () => {
        const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => { fetchOrders(); }, []);

    useEffect(() => {
        let result = orders.filter(o =>
            o.woNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customer?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (statusFilter !== "All") result = result.filter(o => o.status === statusFilter);
        setFilteredOrders(result);
    }, [searchTerm, statusFilter, orders]);

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "orders"), {
                ...newOrder,
                qty: Number(newOrder.qty),
                orderDate: Timestamp.now()
            });
            setShowForm(false);
            setNewOrder({ woNo: "", customer: "", product: "", qty: "", poNo: "", status: "Pending" });
            fetchOrders();
        } catch (err) {
            alert("Error creating order: " + err.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customer Orders List</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage and track all customer work orders and production status.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 font-semibold text-sm sm:text-base"
                >
                    <FaPlus /> New Order
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
                <div className="relative flex-1 group">
                    <FaSearch className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Search by Work Order or Customer name..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-700 w-full lg:w-[180px]"
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">🕒 Pending</option>
                    <option value="In Production">⚙️ In Production</option>
                    <option value="Dispatched">🚚 Dispatched</option>
                </select>
            </div>

            {/* Responsive Layout Container */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                {/* 1. Desktop Table View (Hidden on mobile cards view) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Date</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">WO No</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Customer</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Qty</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Pending</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Status</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">PO No</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-slate-400 italic">No orders found.</td>
                                </tr>
                            ) : (
                                filteredOrders.map(o => {
                                    const items = o.items || [];
                                    const totalOrdered = items.length > 0
                                        ? items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
                                        : (Number(o.qty) || 0);

                                    const totalDispatched = items.length > 0
                                        ? items.reduce((sum, item) => sum + (Number(item.dispatchedQty) || 0), 0)
                                        : (Number(o.dispatchedQty) || 0);

                                    const pending = totalOrdered - totalDispatched;

                                    return (
                                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-5 text-sm text-slate-600 font-medium">{o.orderDate?.toDate().toLocaleDateString("en-IN")}</td>
                                            <td className="p-5"><span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-xs font-bold">{o.woNo}</span></td>
                                            <td className="p-5 text-sm font-semibold text-slate-800">{o.customer}</td>
                                            <td className="p-5 text-sm font-bold text-slate-800 text-center">{totalOrdered.toLocaleString()}</td>
                                            <td className="p-5 text-sm font-bold text-orange-600 text-center">
                                                {pending > 0 ? pending.toLocaleString() : <span className="text-emerald-600">Done</span>}
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${o.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                                    o.status === "In Production" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-sm text-slate-500 font-mono font-bold">{o.poNo}</td>
                                            <td className="p-5">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                    <button onClick={() => navigate(`/orders/${o.id}`)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><FaEdit /></button>
                                                    <button
                                                        onClick={() => handleDelete(o.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-all"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile Responsive Card List View (Visible on small screens) */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-sm">No orders found.</div>
                    ) : (
                        filteredOrders.map(o => {
                            const items = o.items || [];
                            const totalOrdered = items.length > 0
                                ? items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
                                : (Number(o.qty) || 0);

                            const totalDispatched = items.length > 0
                                ? items.reduce((sum, item) => sum + (Number(item.dispatchedQty) || 0), 0)
                                : (Number(o.dispatchedQty) || 0);

                            const pending = totalOrdered - totalDispatched;

                            return (
                                <div key={o.id} className="p-4 space-y-3 bg-white active:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-medium">{o.orderDate?.toDate().toLocaleDateString("en-IN")}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                            o.status === "In Production" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                            }`}>
                                            {o.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-base font-bold text-slate-800">{o.customer}</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">WO: {o.woNo}</span>
                                            <span className="text-slate-500 font-mono text-[11px] font-bold">PO: {o.poNo}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 bg-slate-50 rounded-xl p-3 gap-2 text-xs">
                                        <div>
                                            <p className="text-slate-400">Total Ordered</p>
                                            <p className="font-bold text-slate-800 text-sm">{totalOrdered.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Pending</p>
                                            <p className="font-bold text-sm">
                                                {pending > 0 ? <span className="text-orange-600">{pending.toLocaleString()}</span> : <span className="text-emerald-600">Done</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-1">
                                        <button onClick={() => navigate(`/orders/${o.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                            <FaEdit className="text-slate-400" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(o.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-100 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <FaTrash className="text-rose-400" /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 🟢 PROFESSIONAL NEW ORDER MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl sm:rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Create New Work Order</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">Enter details to initiate a new production cycle.</p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="bg-white p-2.5 sm:p-3 rounded-2xl text-slate-400 hover:text-slate-600 hover:shadow-md transition-all border border-slate-200"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleCreateOrder} className="p-5 sm:p-8 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

                                {/* WO No Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Work Order No</label>
                                    <div className="relative">
                                        <FaHashtag className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="e.g. WO-501"
                                            required
                                            onChange={e => setNewOrder({ ...newOrder, woNo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* PO No Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Purchase Order No</label>
                                    <div className="relative">
                                        <FaFileInvoice className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="e.g. PO/2024/001"
                                            required
                                            onChange={e => setNewOrder({ ...newOrder, poNo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Customer Field */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Customer Name</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="Search or enter customer name"
                                            required
                                            onChange={e => setNewOrder({ ...newOrder, customer: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Product Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Product Description</label>
                                    <div className="relative">
                                        <FaBoxOpen className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="e.g. Industrial MBH Heater"
                                            required
                                            onChange={e => setNewOrder({ ...newOrder, product: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Qty Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Quantity</label>
                                    <div className="relative">
                                        <FaSortNumericUp className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            type="number"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                                            placeholder="0"
                                            required
                                            onChange={e => setNewOrder({ ...newOrder, qty: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="w-full sm:flex-1 px-6 py-3.5 sm:py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all text-sm order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:flex-1 px-6 py-3.5 sm:py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm order-1 sm:order-2"
                                >
                                    Confirm & Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;