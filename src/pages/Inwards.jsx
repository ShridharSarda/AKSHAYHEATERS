import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
    FaSearch, FaPlus, FaTimes, FaArrowDown, FaBuilding, FaFileInvoice, FaSortNumericUp, FaHashtag, FaUser
} from "react-icons/fa";

const Inwards = () => {
    const [inwards, setInwards] = useState([]);
    const [filteredInwards, setFilteredInwards] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [newInward, setNewInward] = useState({
        inwardNo: "", supplierName: "", poNo: "", itemName: "", qtyReceived: "", unit: "kg", receivedBy: ""
    });

    const fetchInwards = async () => {
        try {
            // Changed order key to "createdAt" to match your form submissions perfectly
            const q = query(collection(db, "inwards"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setInwards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching inwards:", err);
        }
    };

    useEffect(() => { 
        fetchInwards(); 
    }, []);

    useEffect(() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = inwards.filter(i => {
            // ✅ FIX: Checking "createdAt" or fallback to "date" fields seamlessly
            const recordDate = i.createdAt?.toDate() || i.date?.toDate();
            
            // ✅ MATCH FIELDS: Adapts to maps like "invoiceNo" or "itemCode" used by your form
            const matchesSearch = 
                (i.invoiceNo || i.inwardNo)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (i.vendorName || i.supplierName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (i.productDescription || i.itemName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.itemCode?.toLowerCase().includes(searchTerm.toLowerCase());

            if (recordDate && recordDate >= startOfDay && recordDate <= endOfDay) {
                return matchesSearch;
            }
            return false;
        });

        setFilteredInwards(result);
    }, [searchTerm, inwards]);

    const handleCreateInward = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "inwards"), {
                invoiceNo: newInward.inwardNo,
                vendorName: newInward.supplierName,
                itemCode: newInward.poNo, // fallback tracking mapping
                productDescription: newInward.itemName,
                quantity: Number(newInward.qtyReceived),
                uom: newInward.unit,
                createdAt: Timestamp.now()
            });
            setShowForm(false);
            setNewInward({ inwardNo: "", supplierName: "", poNo: "", itemName: "", qtyReceived: "", unit: "kg", receivedBy: "" });
            fetchInwards();
        } catch (err) {
            alert("Error logging inward entry: " + err.message);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Material Inward Logs</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Track incoming raw materials and supplier deliveries.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 font-semibold text-sm sm:text-base"
                >
                    <FaPlus /> New Inward Entry
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
                <div className="relative flex-1 group">
                    <FaSearch className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Search by Invoice, Vendor, or Product Code..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Layout Container */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Date</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Invoice No</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Vendor / Supplier</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Product Code</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Description</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Qty Received</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Rack Loc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInwards.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-slate-400 italic">No inward records found for today.</td>
                                </tr>
                            ) : (
                                filteredInwards.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-5 text-sm text-slate-600 font-medium">
                                            {(i.createdAt?.toDate() || i.date?.toDate())?.toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="p-5"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{i.invoiceNo || i.inwardNo}</span></td>
                                        <td className="p-5 text-sm font-semibold text-slate-800">{i.vendorName || i.supplierName || "N/A"}</td>
                                        <td className="p-5 text-sm text-slate-700 font-bold font-mono">{i.itemCode || i.poNo}</td>
                                        <td className="p-5 text-sm text-slate-600">{i.productDescription || i.itemName}</td>
                                        <td className="p-5 text-sm font-bold text-slate-800 text-center">{(i.quantity || i.qtyReceived)?.toLocaleString()} {i.uom || i.unit}</td>
                                        <td className="p-5 text-sm text-slate-500 font-mono font-bold">{i.rackLocation || "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {filteredInwards.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-sm">No inward records found for today.</div>
                    ) : (
                        filteredInwards.map(i => (
                            <div key={i.id} className="p-4 space-y-3 bg-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {(i.createdAt?.toDate() || i.date?.toDate())?.toLocaleDateString("en-IN")}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">{i.invoiceNo || i.inwardNo}</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-800">{i.productDescription || i.itemName}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Vendor: <span className="font-semibold text-slate-700">{i.vendorName || i.supplierName}</span></p>
                                    <div className="flex gap-4 mt-2 text-xs font-mono font-bold text-slate-500">
                                        <span>Code: {i.itemCode || i.poNo}</span>
                                        <span>Rack: {i.rackLocation || "—"}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total Quantities</span>
                                    <span className="font-bold text-slate-800 text-sm">{(i.quantity || i.qtyReceived)?.toLocaleString()} {i.uom || i.unit}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Entry Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-slate-50 p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Create New Inward Entry</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">Fill logs carefully to increment inventory components correctly.</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="bg-white p-2.5 rounded-2xl text-slate-400 border border-slate-200"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleCreateInward} className="p-5 sm:p-8 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Invoice No</label>
                                    <div className="relative">
                                        <FaHashtag className="absolute left-4 top-3.5 text-slate-300" />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="e.g. INV-001" required onChange={e => setNewInward({ ...newInward, inwardNo: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Product Code</label>
                                    <div className="relative">
                                        <FaFileInvoice className="absolute left-4 top-3.5 text-slate-300" />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="e.g. ITEM-XYZ" required onChange={e => setNewInward({ ...newInward, poNo: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Vendor Name</label>
                                    <div className="relative">
                                        <FaBuilding className="absolute left-4 top-3.5 text-slate-300" />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Enter supplier name" required onChange={e => setNewInward({ ...newInward, supplierName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Product Description</label>
                                    <div className="relative">
                                        <FaArrowDown className="absolute left-4 top-3.5 text-slate-300" />
                                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Product name details" required onChange={e => setNewInward({ ...newInward, itemName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Quantity Received</label>
                                    <div className="relative">
                                        <FaSortNumericUp className="absolute left-4 top-3.5 text-slate-300" />
                                        <input type="number" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" placeholder="0" required onChange={e => setNewInward({ ...newInward, qtyReceived: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Measurement Unit</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none" onChange={e => setNewInward({ ...newInward, unit: e.target.value })}>
                                        <option value="Nos">Pieces (Nos)</option>
                                        <option value="KG">KG</option>
                                        <option value="MTR">MTR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowForm(false)} className="w-full sm:flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm order-2 sm:order-1">Cancel</button>
                                <button type="submit" className="w-full sm:flex-1 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 order-1 sm:order-2">Confirm & Save Inward</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inwards;