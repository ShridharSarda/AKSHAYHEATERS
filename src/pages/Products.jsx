import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom"; 

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(location.state?.defaultCategory || "All");
  const [isLowStockOnly, setIsLowStockOnly] = useState(location.state?.showLowStockOnly || false);

  const [formData, setFormData] = useState({
    itemCode: "",
    name: "",
    specification: "",
    category: "Raw Material",
    stock: 0,
    uom: "Nos",
    rackLocation: "",
    minimumStock: "",
    price: "", 
  });

  const fetchProducts = async () => {
    try {
      const rawSnapshot = await getDocs(collection(db, "products"));
      const rawData = rawSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const fgSnapshot = await getDocs(collection(db, "finishedgoods"));
      const fgData = fgSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          itemCode: data.fgCode || "",
          name: data.productName || "",
          specification: data.specification || "",
          category: "Finished Good",
          stock: Number(data.quantity) || 0,
          uom: data.uom || "Nos",
          rackLocation: data.rackLocation || "FG Whse",
          minimumStock: Number(data.minimumStock) || 0,
        };
      });

      setProducts([...rawData, ...fgData]);
    } catch (error) {
      console.error("Error fetching products: ", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const currentStock = Number(product.stock) || 0;
    const minStock = Number(product.minimumStock) || 0;

    if (categoryFilter !== "All" && product.category !== categoryFilter) {
      return false;
    }

    if (isLowStockOnly && currentStock >= minStock) {
      return false;
    }

    const query = searchTerm.toLowerCase();
    return (
      (product.itemCode?.toLowerCase() || "").includes(query) ||
      (product.name?.toLowerCase() || "").includes(query) ||
      (product.rackLocation?.toLowerCase() || "").includes(query) ||
      (product.specification?.toLowerCase() || "").includes(query)
    );
  });

  const handleSave = async () => {
    if (!formData.itemCode || !formData.name) {
      alert("Product Code and Product Name are required");
      return;
    }

    try {
      if (formData.category === "Finished Good") {
        await addDoc(collection(db, "finishedgoods"), {
          fgCode: formData.itemCode,
          productName: formData.name,
          specification: formData.specification,
          quantity: Number(formData.stock),
          uom: formData.uom,
          productionDate: new Date().toISOString().split('T')[0],
          status: "Ready",
          remarks: "Production Completed",
          minimumStock: Number(formData.minimumStock) || 0,
          rackLocation: formData.rackLocation || "FG Whse"
        });
        alert("Finished Good added successfully!");
      } else {
        await addDoc(collection(db, "products"), {
          ...formData,
          stock: Number(formData.stock),
          minimumStock: Number(formData.minimumStock),
          createdAt: new Date(),
        });
        alert("Raw Material added successfully!");
      }

      setShowModal(false);
      fetchProducts();

      setFormData({
        itemCode: "",
        name: "",
        specification: "",
        category: "Raw Material",
        stock: 0,
        uom: "Nos",
        rackLocation: "",
        minimumStock: "",
        price: ""
      });

    } catch (err) {
      console.error("Error saving product: ", err);
      alert("Failed to save product: " + err.message);
    }
  };

  return (
    // 🟢 OPTIMIZED: Replaced absolute centering container constraints with space alignment styles
    <div className="p-6 space-y-6 text-gray-800 bg-gray-50">
      
      {/* Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLowStockOnly ? "⚠️ Viewing Low Stock Alerts Only" : "Manage Raw Materials & Finished Goods"}
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
            + Add Product
          </button>
        </div>
      </div>

      {/* Search Bar Row */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search by Product Code, Name, Specification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 focus:ring-0 outline-none text-gray-700 placeholder-gray-400 text-sm"
          />
        </div>
        <div className="w-full sm:w-56 bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-700 text-sm font-medium cursor-pointer"
          >
            <option value="All">📁 All Categories</option>
            <option value="Raw Material">📦 Raw Material</option>
            <option value="Finished Good">⚙️ Finished Good</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Specification</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No matching products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
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
                      <td className="p-4 text-gray-900 font-medium">{product.name || "-"}</td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{product.specification || "-"}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${product.category === "Raw Material"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                          {product.category || "Unassigned"}
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

      {/* Mobile Stacked Card View */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
            No matching products found.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const currentStock = Number(product.stock) || 0;
            const minStock = Number(product.minimumStock) || 0;
            const isLow = currentStock < minStock;

            return (
              <div
                key={product.id}
                onClick={() => navigate("/ProductDetails", { state: { product } })}
                className={`bg-white p-4 rounded-xl border shadow-sm space-y-3 cursor-pointer hover:border-gray-300 active:bg-gray-50 transition-all ${isLow ? 'border-red-200 bg-red-50/10' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">{product.itemCode || "NO CODE"}</span>
                    <h3 className="font-bold text-gray-900 text-base mt-0.5">{product.name || "-"}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${product.category === "Raw Material"
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                    {product.category}
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

      {/* Modal View Block */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-semibold sm:hidden">&times;</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Code *</label>
                <input
                  placeholder="e.g. RM-001"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name *</label>
                <input
                  placeholder="e.g. Ceramic Collar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Specification</label>
                <input
                  placeholder="e.g. 15mm Outer Diameter"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Raw Material">Raw Material</option>
                  <option value="Finished Good">Finished Good</option>
                </select>
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
                  placeholder="e.g. Shelf A1"
                  value={formData.rackLocation}
                  onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Unit Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Minimum Stock Alert Level</label>
                <input
                  type="number"
                  placeholder="Get alert when stock drops below this number"
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
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;