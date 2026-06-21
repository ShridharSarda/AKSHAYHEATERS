import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom"; 

const FinishedGoods = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  
  const passedCategory = location.state?.defaultCategory;
  const currentCategory = passedCategory || "Finished Goods Inventory";

  const [searchTerm, setSearchTerm] = useState("");
  const [isLowStockOnly, setIsLowStockOnly] = useState(location.state?.showLowStockOnly || false);

  // 🟢 PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    itemCode: "",
    name: "",
    specification: "",
    category: passedCategory || "Theormo", 
    itemType: "Finished Good", 
    stock: 0,
    uom: "Nos",
    rackLocation: "",
    minimumStock: "",
    price: "", 
  });

  const fetchData = async () => {
    try {
      const inventorySnapshot = await getDocs(collection(db, "inventory"));
      const inventoryData = inventorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(inventoryData);
    } catch (error) {
      console.error("Error fetching data from inventory: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🟢 Reset pagination back to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, isLowStockOnly, passedCategory]);

  // 1. Filter out the items based on inventory conditions
  const filteredProducts = products.filter((product) => {
    if (isLowStockOnly) {
      const currentStock = Number(product.stock ?? product.quantity ?? 0);
      const minStock = Number(product.minimumStock || 0);
      if (currentStock >= minStock) {
        return false;
      }
    }

    if (!isLowStockOnly && product.itemType !== "Finished Good") {
      return false;
    }

    if (passedCategory && passedCategory !== "Finished Good") {
      if (product.category !== passedCategory) return false;
    }

    const query = searchTerm.toLowerCase();
    return (
      (product.itemCode?.toLowerCase() || "").includes(query) ||
      (product.name?.toLowerCase() || "").includes(query) ||
      (product.rackLocation?.toLowerCase() || "").includes(query) ||
      (product.specification?.toLowerCase() || "").includes(query)
    );
  });

  // 🟢 2. PAGINATION MATH: Slicing the matching array down to 10 rows
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPaginatedProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleSave = async () => {
    if (!formData.itemCode || !formData.name || !formData.category) {
      alert("Product Code, Name, and Category are required fields!");
      return;
    }

    try {
      await addDoc(collection(db, "inventory"), {
        ...formData,
        stock: Number(formData.stock) || 0,
        minimumStock: Number(formData.minimumStock) || 0,
        price: Number(formData.price) || 0,
        createdAt: new Date(),
      });

      alert("Finished Good added successfully!");
      setShowModal(false);
      fetchData();

      setFormData({
        itemCode: "",
        name: "",
        specification: "",
        category: passedCategory || "Theormo",
        itemType: "Finished Good",
        stock: 0,
        uom: "Nos",
        rackLocation: "",
        minimumStock: "",
        price: ""
      });

    } catch (err) {
      console.error("Error saving finished good: ", err);
      alert("Failed to save: " + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 text-gray-800 bg-gray-50 min-h-screen">
      
      {/* Back Link Wrapper */}
      <button 
        onClick={() => navigate("/dashboard")}
        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
      >
        <span className="transform group-hover:-translate-x-0.5 transition-transform">&larr;</span> Back to Dashboard
      </button>

      {/* Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 capitalize">
            {isLowStockOnly ? "Low Stock Alerts (Finished Goods)" : currentCategory}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLowStockOnly ? "⚠️ Viewing low items across entire finished goods" : "Viewing items classified under Finished Goods"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isLowStockOnly && (
            <button
              onClick={() => setIsLowStockOnly(false)}
              className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors whitespace-nowrap"
            >
              Show All Items [X]
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors text-center"
          >
            + Add Finished Good
          </button>
        </div>
      </div>

      {/* Search Bar Row */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search finished goods by Code, Name, Rack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 focus:ring-0 outline-none text-gray-700 placeholder-gray-400 text-sm"
          />
        </div>
        
        <div className="w-full sm:w-64 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 flex items-center justify-center">
          <span className="text-gray-700 text-sm font-semibold">⚙️ Finished Goods Only</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {currentPaginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No matching finished goods found.
                  </td>
                </tr>
              ) : (
                currentPaginatedProducts.map((product) => {
                  const currentStock = Number(product.stock) || 0;
                  const minStock = Number(product.minimumStock) || 0;
                  const isLow = currentStock < minStock;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => navigate("/ProductDetails", { state: { product } })}
                      className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-gray-900 whitespace-nowrap">{product.itemCode || "-"}</td>
                      <td className="p-4 text-gray-900 font-medium">
                        <div>{product.name || "-"}</div>
                        <span className="text-xs text-gray-400 font-normal">{product.specification || "-"}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          {product.itemType}
                        </span>
                      </td>
                      <td className={`p-4 font-semibold ${isLow ? "text-red-600 bg-red-50/20 font-bold" : "text-gray-900"}`}>
                        {product.stock ?? "-"} {isLow && "⚠️"}
                      </td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{product.uom || "-"}</td>
                      <td className="p-4 text-gray-600 whitespace-nowrap">{product.rackLocation || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {currentPaginatedProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
            No matching finished goods found.
          </div>
        ) : (
          currentPaginatedProducts.map((product) => {
            const currentStock = Number(product.stock) || 0;
            const minStock = Number(product.minimumStock) || 0;
            const isLow = currentStock < minStock;

            return (
              <div
                key={product.id}
                onClick={() => navigate("/ProductDetails", { state: { product } })}
                className={`bg-white p-4 rounded-xl border shadow-sm space-y-3 cursor-pointer ${isLow ? 'border-red-200 bg-red-50/10' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">{product.itemCode || "NO CODE"}</span>
                    <h3 className="font-bold text-gray-900 text-base mt-0.5">{product.name || "-"}</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    Finished Good
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">Specification</span>
                    <span className="text-gray-700 font-medium break-words">{product.specification || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Rack Location</span>
                    <span className="text-gray-700 font-medium">{product.rackLocation || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Current Stock</span>
                    <span className={`font-bold text-base ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock} <span className="text-xs font-normal text-gray-500">{product.uom}</span>
                      {isLow && " ⚠️"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🟢 PAGINATION CONTROLS FOOTER */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="text-gray-800 font-semibold">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-gray-800 font-semibold">
              {Math.min(indexOfLastItem, filteredProducts.length)}
            </span>{" "}
            of <span className="text-gray-800 font-semibold">{filteredProducts.length}</span> finished items
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              &larr; Prev
            </button>
            
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`h-8 w-8 text-sm font-bold rounded-lg transition-colors ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 border border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Modal Block */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Finished Good</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-semibold sm:hidden">&times;</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Code *</label>
                <input
                  placeholder="e.g. FG-001"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name *</label>
                <input
                  placeholder="e.g. MICA HEATER"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Specification</label>
                <input
                  placeholder="e.g. 230V / 500W"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Initial Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">UOM</label>
                <select
                  value={formData.uom}
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Nos">Pieces (Nos)</option>
                  <option value="KG">KG</option>
                  <option value="MTR">MTR</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Rack Location</label>
                <input
                  placeholder="e.g. FG-A1"
                  value={formData.rackLocation}
                  onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Unit Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1250"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Minimum Stock Alert Level</label>
                <input
                  type="number"
                  placeholder="Get alert when finished stock drops below this number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
              >
                Save Finished Good
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedGoods;