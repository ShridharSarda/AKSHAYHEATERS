import { useLocation, useNavigate } from "react-router-dom";

const ProductDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { product } = location.state || {}; 

    // 🟢 ADMIN RULE PROTECTION GUARD: 
    // Assuming you have an authentication state, we verify user context here.
    // For demonstration, we'll check a mock variable. Replace with your actual context/localStorage role key.
    const userRole = "Admin"; // Options: "Admin" or "Staff"

    if (userRole !== "Admin") {
        return (
            <div className="p-6 max-w-md mx-auto text-center bg-white rounded-xl shadow-md border mt-12">
                <div className="text-red-500 text-4xl mb-2">🚫</div>
                <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
                <p className="text-sm text-gray-500 mt-1 mb-4">Only authorized Administrators can view pricing and breakdown metrics.</p>
                <button onClick={() => navigate("/products")} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">
                    Return to Products List
                </button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">No product data found.</p>
                <button onClick={() => navigate("/products")} className="text-blue-600 underline text-sm mt-2 block">
                    Go back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
            <button 
                onClick={() => navigate("/products")} 
                className="mb-4 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
                ← Back to Products
            </button>
            
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">{product.name}</h1>
            <p className="text-sm text-gray-400 font-mono mb-6">Code ID: {product.itemCode}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 border-t border-gray-100 pt-6">
                <div>
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Category</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                        product.category === "Raw Material" ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}>{product.category}</span>
                </div>
                
                <div>
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Specification</span>
                    <span className="font-semibold text-gray-700 text-base mt-1 block">{product.specification || "-"}</span>
                </div>

                <div>
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Current Live Inventory Inventory</span>
                    <span className="font-bold text-xl text-gray-900 mt-1 block">{product.stock} <span className="text-sm font-normal text-gray-500">{product.uom}</span></span>
                </div>

                <div>
                    <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Rack Warehouse Location</span>
                    <span className="font-semibold text-gray-700 text-base mt-1 block">{product.rackLocation || "-"}</span>
                </div>

                {/* 🟢 EXTRA ADDED FEATURE: Exclusive Price View Column for Admin Only */}
                <div className="sm:col-span-2 border-t border-dashed border-gray-100 pt-4 bg-gray-50/50 p-4 rounded-xl">
                    <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Financial Valuation (Base Unit Price)</span>
                    <span className="font-extrabold text-2xl text-green-600 mt-1 block">
                        ₹{(product.price || 0).toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">per {product.uom}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;