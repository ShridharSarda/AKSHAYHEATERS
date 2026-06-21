import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, increment, addDoc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const Inward = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorCode: "",
    invoiceNo: "",
    invoiceDate: "",
    itemCode: "", 
    productDescription: "", 
    quantity: "",
    uom: "Nos",
    rate: "",
    rackLocation: "",
    jobDescription: "",
  });

  // Fetch current products from 'inventory'
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const productsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAvailableProducts(productsList);
    } catch (error) {
      console.error("Error fetching products for dropdown:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-fill details if code matches from dropdown, otherwise let the user type a custom name
  const handleItemCodeChange = (code) => {
    const matchedProduct = availableProducts.find(
      (p) => p.itemCode?.toLowerCase() === code.trim().toLowerCase()
    );

    if (matchedProduct) {
      setFormData((prev) => ({
        ...prev,
        itemCode: code,
        productDescription: matchedProduct.name || "",
        rackLocation: matchedProduct.rackLocation || "",
        uom: matchedProduct.uom || "Nos",
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        itemCode: code,
      }));
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.quantity || !formData.invoiceNo) {
      alert("Invoice No, Product Code, and Quantity are mandatory!");
      return;
    }

    try {
      setLoading(true);
      const inwardQty = Number(formData.quantity) || 0;
      const inwardRate = Number(formData.rate) || 0; // 👈 Extract unit rate safely

      // 1. Check if the product code already exists
      const targetProduct = availableProducts.find(
        (p) => p.itemCode?.toLowerCase() === formData.itemCode.trim().toLowerCase()
      );

      if (targetProduct) {
        // --- SCENARIO A: PRODUCT EXISTS -> ATOMIC INCREMENT & UPDATE PRICE ---
        const productRef = doc(db, "inventory", targetProduct.id);
        await updateDoc(productRef, {
          stock: increment(inwardQty),
          rackLocation: formData.rackLocation || targetProduct.rackLocation || "",
          price: inwardRate > 0 ? inwardRate : (targetProduct.price || 0), // 👈 Update inventory baseline price if a new rate is provided
        });
      } else {
        // --- SCENARIO B: NEW PRODUCT -> AUTO-CREATE INVENTORY DOCUMENT ---
        const cleanCode = formData.itemCode.trim();
        const newProductDocId = cleanCode.replace(/[^a-zA-Z0-9-_]/g, "-");
        const newProductRef = doc(db, "inventory", newProductDocId);

        await setDoc(newProductRef, {
          itemCode: cleanCode,
          name: formData.productDescription || `Product ${cleanCode}`,
          stock: inwardQty, 
          minimumStock: 0,  
          rackLocation: formData.rackLocation || "",
          uom: formData.uom,
          itemType: "Raw Material", 
          price: inwardRate, // 👈 Maps the incoming form 'rate' to the product's 'price' property field!
          createdAt: new Date(),
        });
      }

      // 3. LOG TRANSACTION HISTORY UNCHANGED
      await addDoc(collection(db, "inwards"), {
        ...formData,
        quantity: inwardQty,
        rate: inwardRate,
        totalValue: (inwardQty * inwardRate),
        createdAt: new Date(),
      });

      alert(`Successfully processed inward stock for ${formData.itemCode}!`);
      
      // Reset Form and Refresh Local Memory Buffer List
      setFormData({
        vendorName: "",
        vendorCode: "",
        invoiceNo: "",
        invoiceDate: "",
        itemCode: "",
        productDescription: "",
        quantity: "",
        uom: "Nos",
        rate: "",
        rackLocation: "",
        jobDescription: "",
      });

      await fetchProducts(); 
    } catch (error) {
      console.error("Error processing material inward request: ", error);
      alert("Failed to submit entry: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-gray-800 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-2">Material Inward Entry</h1>
        <p className="text-sm text-gray-500">Record incoming shipments. Unknown codes are auto-created instantly.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* Section 1: Vendor & Invoice Details */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 border-b pb-1">1. Vendor & Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Vendor Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Vendor Code</label>
              <input
                type="text"
                placeholder="e.g. VEND-09"
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Invoice No *</label>
              <input
                type="text"
                placeholder="INV/26-27/001"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Material Info & Quantities */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 border-b pb-1">2. Item Receipt Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Product Code (Lookup) *</label>
              <input
                type="text"
                list="product-codes"
                placeholder="Type or select code..."
                value={formData.itemCode}
                onChange={(e) => handleItemCodeChange(e.target.value)}
                className="w-full border border-blue-200 bg-blue-50/20 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                required
              />
              <datalist id="product-codes">
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.itemCode}>{p.name}</option>
                ))}
              </datalist>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Product Description (Type name if new)</label>
              <input
                type="text"
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                placeholder="Autofilled if matched, otherwise enter custom name here..."
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Inward Quantity *</label>
              <input
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white font-semibold text-blue-600 text-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">UOM</label>
              <select
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              >
                <option value="Nos">Pieces (Nos)</option>
                <option value="KG">KG</option>
                <option value="MTR">MTR</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Unit Rate (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Rack Location</label>
              <input
                type="text"
                placeholder="e.g. B-04"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Job Details / Description</label>
              <input
                type="text"
                placeholder="e.g. Ordered for project alpha production line"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/Products")}
            className="px-5 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Inward Stock"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Inward;