import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaSearch, FaPlus, FaTimes, FaEdit, FaTrash, FaUser, FaPhone, FaIdCard, FaMapMarkerAlt } from "react-icons/fa";

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Initial state matching fields expected by your orders page lookup
    const [newCustomer, setNewCustomer] = useState({
        customerName: "",
        customerCode: "",
        contactPerson: "",
        phoneNo: "",
        address: ""
    });

    const fetchCustomers = async () => {
        try {
            const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error fetching customers: ", err);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Search filter logic
    useEffect(() => {
        const result = customers.filter(c =>
            c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCustomers(result);
    }, [searchTerm, customers]);

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "customers"), {
                ...newCustomer,
                createdAt: Timestamp.now()
            });
            setShowForm(false);
            // Reset fields
            setNewCustomer({
                customerName: "",
                customerCode: "",
                contactPerson: "",
                phoneNo: "",
                address: ""
            });
            fetchCustomers();
        } catch (err) {
            alert("Error creating customer profile: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this customer profile?")) {
            try {
                await deleteDoc(doc(db, "customers", id));
                fetchCustomers();
            } catch (err) {
                alert("Error deleting customer: " + err.message);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customer Database</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Register accounts, manage system profiles, and configure contact details.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 font-semibold text-sm sm:text-base"
                >
                    <FaPlus /> Add New Customer
                </button>
            </div>

            {/* Quick Filter Search Bar */}
            <div className="relative flex-1 group mb-6">
                <FaSearch className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Search profiles by company name, client code, or point of contact..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Profiles Container Layout */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Customer Code</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Company / Customer Name</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Person</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Phone No</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Primary Location Address</th>
                                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 italic">No customers profiles found. Add profiles to link them inside orders.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-5">
                                            <span className="font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                                {c.customerCode || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-slate-800">{c.customerName}</td>
                                        <td className="p-5 text-sm text-slate-600 font-medium">{c.contactPerson}</td>
                                        <td className="p-5 text-sm font-mono text-slate-600">{c.phoneNo}</td>
                                        <td className="p-5 text-sm text-slate-500 max-w-xs truncate">{c.address || "—"}</td>
                                        <td className="p-5">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-all"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Responsive Grid List */}
                <div className="block md:hidden divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic text-sm">No profile data saved.</div>
                    ) : (
                        filteredCustomers.map(c => (
                            <div key={c.id} className="p-4 space-y-2.5 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-base font-bold text-slate-800">{c.customerName}</h4>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {c.customerCode}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600">
                                    <div><span className="font-semibold text-slate-400">Contact:</span> {c.contactPerson}</div>
                                    <div><span className="font-semibold text-slate-400">Phone:</span> {c.phoneNo}</div>
                                    {c.address && <div className="truncate"><span className="font-semibold text-slate-400">Addr:</span> {c.address}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CREATE CUSTOMER MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl sm:rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-5 sm:p-7 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Register Customer</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">This registers a persistent profile that links directly into the order ledger forms.</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="bg-white p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 border border-slate-200">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateCustomer} className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4">
                            {/* Company / Customer Name */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Company / Customer Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-4 top-3.5 text-slate-300" />
                                    <input
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="e.g. Acme Manufacturing Corp" required value={newCustomer.customerName}
                                        onChange={e => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Customer Code */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Customer Code</label>
                                    <div className="relative">
                                        <FaIdCard className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold tracking-wide"
                                            placeholder="e.g. ACME-01" required value={newCustomer.customerCode}
                                            onChange={e => setNewCustomer({ ...newCustomer, customerCode: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>

                                {/* Contact Person */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Contact Person Name</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-4 top-3.5 text-slate-300" />
                                        <input
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                            placeholder="e.g. Bruce Wayne" required value={newCustomer.contactPerson}
                                            onChange={e => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-4 top-3.5 text-slate-300" />
                                    <input
                                        type="tel"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="e.g. +91 9999999999" required value={newCustomer.phoneNo}
                                        onChange={e => setNewCustomer({ ...newCustomer, phoneNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Office / Factory Address</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-4 top-3.5 text-slate-300" />
                                    <textarea
                                        rows="2"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold resize-none"
                                        placeholder="Enter primary address description details..." value={newCustomer.address}
                                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                                <button
                                    type="button" onClick={() => setShowForm(false)}
                                    className="w-full sm:flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all text-sm order-2 sm:order-1 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm order-1 sm:order-2"
                                >
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;