import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const ProductCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states for creating a new category
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [subInput, setSubInput] = useState("");
  const [newSubcategories, setNewSubcategories] = useState([]);

  const fetchCategoriesAndCounts = async () => {
    try {
      // 1. Fetch user-defined categories
      const catSnapshot = await getDocs(collection(db, "categories"));
      const catList = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Fetch all inventory items to calculate counts dynamically
      const invSnapshot = await getDocs(collection(db, "inventory"));
      const invItems = invSnapshot.docs.map(doc => doc.data());

      // 3. Map counts to categories
      const finalizedCategories = catList.map(cat => {
        const matchingItems = invItems.filter(item => item.category === cat.name);
        return {
          ...cat,
          count: matchingItems.length
        };
      });

      setCategories(finalizedCategories);
      setLoading(false);
    } catch (error) {
      console.error("Error loading categories:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndCounts();
  }, []);

  // Add subcategory tag to local array before saving
  const handleAddSubcategoryTag = (e) => {
    e.preventDefault();
    if (!subInput.trim()) return;
    if (!newSubcategories.includes(subInput.trim())) {
      setNewSubcategories([...newSubcategories, subInput.trim()]);
    }
    setSubInput("");
  };

  // Remove a subcategory tag from modal list
  const handleRemoveSubcategoryTag = (indexToRemove) => {
    setNewSubcategories(newSubcategories.filter((_, idx) => idx !== indexToRemove));
  };

  // Save category structural definition to Firestore
  const handleSaveCategory = async () => {
    if (!newCatName.trim()) {
      alert("Category name is required!");
      return;
    }

    try {
      await addDoc(collection(db, "categories"), {
        name: newCatName.trim(),
        subcategories: newSubcategories
      });

      alert(`Category "${newCatName}" created successfully!`);
      
      // Reset State & Close Modal
      setNewCatName("");
      setNewSubcategories([]);
      setShowCatModal(false);
      
      // Refresh list grid
      fetchCategoriesAndCounts();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category: " + error.message);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading Categories...</div>;

  return (
    <div className="p-6 space-y-6 text-gray-800 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Select a category to view subcategories and items.</p>
        </div>
        
        {/* 🟢 FIXED: Button now toggles modal active status */}
        <button 
          onClick={() => setShowCatModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Create Category
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl border text-center text-gray-400 text-sm">
            No categories defined yet. Click "+ Create Category" to get started!
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate("/ProductsList", { state: { defaultCategory: cat.name } })}
              className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 shadow-sm cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="text-3xl">📁</div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h2>
                <div className="flex flex-wrap gap-1 pt-1">
                  {cat.subcategories?.map((sub, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center text-xs border-t pt-3 border-gray-100">
                <span className="font-semibold text-blue-600">{cat.count} Items Total</span>
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">Explore &rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🆕 Create Category Modal Element */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New Category Hierarchy</h2>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-semibold">&times;</button>
            </div>

            <div className="space-y-4">
              {/* Category Name Input */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Category Parent Title *</label>
                <input
                  placeholder="e.g. Thermopower, Heaters"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Subcategories Addition Form */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Add Subcategory Types</label>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Raw Material, Mica Type"
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategoryTag(e)}
                    className="flex-1 border border-gray-200 p-2 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleAddSubcategoryTag}
                    className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-900"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Temporary subcategory pill display lists */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {newSubcategories.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">No subcategories attached yet.</span>
                ) : (
                  newSubcategories.map((sub, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                      {sub}
                      <button 
                        onClick={() => handleRemoveSubcategoryTag(idx)}
                        className="text-blue-400 hover:text-blue-700 text-xs font-bold font-mono pl-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Modal Bottom Actions Row */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategories;