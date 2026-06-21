import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaPlus, FaSearch, FaTrash, FaUserTie, FaTimes, 
  FaHashtag, FaBuilding, FaUser, FaPhone 
} from "react-icons/fa";

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendorCode: "", vendorName: "", contactPerson: "", phone: ""
  });

  const fetchVendors = async () => {
    const q = query(collection(db, "vendors"), orderBy("vendorName"));
    const snapshot = await getDocs(q);
    setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "vendors"), newVendor);
    setShowForm(false);
    setNewVendor({ vendorCode: "", vendorName: "", contactPerson: "", phone: "" });
    fetchVendors();
  };

  const filteredVendors = vendors.filter(v => 
    v.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vendors</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your supply chain partners and contact details.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 font-semibold"
        >
          <FaPlus /> Add New Vendor
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group mb-6">
        <FaSearch className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by vendor name or code..." 
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Code</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Vendor Name</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Contact Person</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">Phone</th>
                <th className="p-5 text-slate-500 font-bold text-[11px] uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVendors.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-5 text-sm font-bold text-slate-800"><span className="bg-slate-100 px-2 py-1 rounded">{v.vendorCode}</span></td>
                  <td className="p-5 text-sm font-semibold text-slate-900">{v.vendorName}</td>
                  <td className="p-5 text-sm text-slate-600">{v.contactPerson}</td>
                  <td className="p-5 text-sm text-slate-600 font-mono">{v.phone}</td>
                  <td className="p-5 text-center">
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">New Vendor</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full"><FaTimes /></button>
            </div>
            <form onSubmit={handleAddVendor} className="p-8 space-y-4">
              <div className="relative">
                <FaHashtag className="absolute left-4 top-3.5 text-slate-300" />
                <input required placeholder="Vendor Code" className="w-full pl-11 p-3 bg-slate-50 border rounded-2xl text-sm" onChange={e => setNewVendor({...newVendor, vendorCode: e.target.value})} />
              </div>
              <div className="relative">
                <FaBuilding className="absolute left-4 top-3.5 text-slate-300" />
                <input required placeholder="Vendor Name" className="w-full pl-11 p-3 bg-slate-50 border rounded-2xl text-sm" onChange={e => setNewVendor({...newVendor, vendorName: e.target.value})} />
              </div>
              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-slate-300" />
                <input placeholder="Contact Person" className="w-full pl-11 p-3 bg-slate-50 border rounded-2xl text-sm" onChange={e => setNewVendor({...newVendor, contactPerson: e.target.value})} />
              </div>
              <div className="relative">
                <FaPhone className="absolute left-4 top-3.5 text-slate-300" />
                <input placeholder="Phone Number" className="w-full pl-11 p-3 bg-slate-50 border rounded-2xl text-sm" onChange={e => setNewVendor({...newVendor, phone: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 mt-4">Save Vendor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;