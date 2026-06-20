import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ProductDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { product } = location.state || {}; 

    // State to handle image upload preview
    const [productImage, setProductImage] = useState(product?.image || null);

    // 🟢 ADMIN RULE PROTECTION GUARD
    const userRole = "Admin"; 

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

    // Handle Image Upload change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProductImage(imageUrl);
            // Note: In production, upload this file to your backend API or cloud storage here
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
            <button 
                onClick={() => navigate("/products")} 
                className="mb-4 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
                ← Back to Products
            </button>
            
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">{product.name}</h1>
            <p className="text-sm text-gray-400 font-mono mb-6">Code ID: {product.itemCode}</p>
            
            {/* Split Screen Layout: Left for Image, Right for Details Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-6">
                
                {/* 📸 IMAGE UPLOAD / DISPLAY PANEL */}
                <div className="flex flex-col items-center justify-start bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Product Image</span>
                    
                    <div className="w-full aspect-square max-w-[240px] bg-white rounded-lg border flex items-center justify-center overflow-hidden relative group shadow-sm mb-4">
                        {productImage ? (
                            <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <span className="text-3xl text-gray-300">📦</span>
                                <p className="text-xs text-gray-400 mt-1">No Image Uploaded</p>
                            </div>
                        )}
                    </div>

                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-all">
                        {productImage ? "Change Picture" : "Upload Picture"}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>

                {/* 📊 INFORMATION TABLE PANEL */}
                <div className="md:col-span-2 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-semibold text-gray-400 uppercase tracking-wider text-xs w-1/3">Category</td>
                                <td className="py-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        product.category === "Raw Material" ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                                    }`}>{product.category}</span>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-semibold text-gray-400 uppercase tracking-wider text-xs">Specification</td>
                                <td className="py-3 text-gray-700 font-medium">{product.specification || "-"}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-semibold text-gray-400 uppercase tracking-wider text-xs">Current Live Inventory</td>
                                <td className="py-3 text-gray-900 font-bold text-base">
                                    {product.stock} <span className="text-xs font-normal text-gray-500">{product.uom}</span>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-semibold text-gray-400 uppercase tracking-wider text-xs">Warehouse Location</td>
                                <td className="py-3 text-gray-700 font-medium">{product.rackLocation || "-"}</td>
                            </tr>
                            
                            {/* 🟢 Exclusive Price Row for Admin Only */}
                            <tr className="bg-gray-50/70">
                                <td className="p-3 font-bold text-gray-500 uppercase tracking-wider text-xs rounded-l-lg">Base Unit Price</td>
                                <td className="p-3 rounded-r-lg">
                                    <span className="font-extrabold text-xl text-green-600">
                                        ₹{(product.price || 0).toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-xs font-normal text-gray-400 ml-1">per {product.uom}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ProductDetails;