    import { useState, useEffect } from "react";
import { collection, getDocs, doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const ProductionIssue = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  
  // Form Metadata States
  const [issueNo, setIssueNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [purpose, setPurpose] = useState("");

  // Item Selector States
  const [selectedProductId, setSelectedProductId] = useState("");
  const [issueQuantity, setIssueQuantity] = useState(1);
  
  // The List of Added Items for this Issue voucher
  const [issuedItems, setIssuedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch available stock items for lookup dropdown
  const fetchInventory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "inventory"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventory(items);
    } catch (error) {
      console.error("Error fetching inventory for production issue:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
    // Auto-generate a clean pseudo-random Issue Number (e.g., IS-202606-XYZ)
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    setIssueNo(`IS-${dateStr}-${randomStr}`);
  }, []);

  // 2. Add an item into the local staging list table
  const handleAddItem = () => {
    if (!selectedProductId) {
      alert("Please choose a product code/name first!");
      return;
    }
    if (Number(issueQuantity) <= 0) {
      alert("Quantity must be greater than 0!");
      return;
    }

    const matchedItem = inventory.find((item) => item.id === selectedProductId);
    if (!matchedItem) return;

    // Check if item's available stock can fulfill the local request
    const availableStock = Number(matchedItem.stock || 0);
    if (Number(issueQuantity) > availableStock) {
      alert(`Insufficient stock! Only ${availableStock} ${matchedItem.uom || "Nos"} available.`);
      return;
    }

    // If item already exists in current list, update its quantity instead of duplicating rows
    const duplicateIndex = issuedItems.findIndex((i) => i.id === selectedProductId);
    if (duplicateIndex > -1) {
      const updatedItems = [...issuedItems];
      const newQty = updatedItems[duplicateIndex].quantity + Number(issueQuantity);
      
      if (newQty > availableStock) {
        alert(`Cannot add more. Total would exceed current available stock (${availableStock}).`);
        return;
      }
      updatedItems[duplicateIndex].quantity = newQty;
      setIssuedItems(updatedItems);
    } else {
      // Add as a new row entry
      setIssuedItems([
        ...issuedItems,
        {
          id: matchedItem.id,
          itemCode: matchedItem.itemCode,
          name: matchedItem.name,
          specification: matchedItem.specification,
          uom: matchedItem.uom || "Nos",
          quantity: Number(issueQuantity),
        },
      ]);
    }

    // Reset lookup fields
    setSelectedProductId("");
    setIssueQuantity(1);
  };

  // Remove item from the staging list table
  const handleRemoveItem = (index) => {
    setIssuedItems(issuedItems.filter((_, i) => i !== index));
  };

  // 3. 🟢 SUBMIT & DECREASE STOCK VIA FIRESTORE TRANSACTION
  const handleConfirmIssue = async () => {
    if (!purpose.trim()) {
      alert("Please enter the purpose for this production issue!");
      return;
    }
    if (issuedItems.length === 0) {
      alert("Your item list is empty! Add at least one item to issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Run a single safe atomic database transaction
      await runTransaction(db, async (transaction) => {
        const reads = issuedItems.map((item) => {
          const itemRef = doc(db, "inventory", item.id);
          return transaction.get(itemRef).then((snapshot) => {
            if (!snapshot.exists()) {
              throw new Error(`Product ${item.itemCode} does not exist in database!`);
            }
            return { snapshot, itemRef, itemRequested: item };
          });
        });

        const readResults = await Promise.all(reads);

        // Verify all stock values BEFORE applying any updates
        for (const res of readResults) {
          const currentStock = Number(res.snapshot.data().stock || 0);
          if (currentStock < res.itemRequested.quantity) {
            throw new Error(`Stock level changed for ${res.itemRequested.itemCode}! Only ${currentStock} left.`);
          }
        }

        // Apply decreases securely
        for (const res of readResults) {
          const currentStock = Number(res.snapshot.data().stock || 0);
          const nextStock = currentStock - res.itemRequested.quantity;
          transaction.update(res.itemRef, { stock: nextStock });
        }

        // Create the Production Issue Log entry inside transaction
        const logRef = doc(collection(db, "production_issues"));
        transaction.set(logRef, {
          issueNo,
          issueDate,
          purpose: purpose.trim(),
          items: issuedItems,
          createdAt: new Date(),
        });
      });

      alert("Production issue processed successfully! Stock records have been decreased.");
      navigate("/dashboard");

    } catch (error) {
      console.error("Transaction failed: ", error);
      alert("Transaction Failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-gray-800 bg-gray-50 min-h-screen">
      
      {/* Navigation Header */}
      <button 
        onClick={() => navigate("/dashboard")}
        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
      >
        <span>&larr;</span> Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Production Issue Voucher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Issue raw materials or components to the factory floor. This will instantly deduct amounts from live stock counts.
        </p>
      </div>

      {/* Section 1: Metadata Fields */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Issue Voucher No</label>
          <input
            type="text"
            value={issueNo}
            onChange={(e) => setIssueNo(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-sm font-semibold text-gray-700 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Issue Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Purpose / Job Details *</label>
          <input
            type="text"
            placeholder="e.g. Issuing for Heating Element Line Assembly"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Section 2: Interactive Item Search Picker Box */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600">Select & Add Items to Issue</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Search Product / Material Code</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-200 p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Choose Item from Inventory (Shows Live Stock) --</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode || "N/A"} - {item.name} ({item.specification || "No Specs"}) | Stock: {item.stock ?? 0} {item.uom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Issue Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(e.target.value)}
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-50 text-blue-600 border border-blue-200 px-5 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: List Table of added entries */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Voucher Itemized List</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-center">Issue Qty</th>
                <th className="p-4 text-left">UOM</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {issuedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">
                    No items added to this issue voucher yet. Choose items above.
                  </td>
                </tr>
              ) : (
                issuedItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{item.itemCode || "-"}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.specification}</div>
                    </td>
                    <td className="p-4 text-center font-bold text-blue-600">{item.quantity}</td>
                    <td className="p-4 text-gray-600">{item.uom}</td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Save Summary controls bar */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 border border-gray-200 bg-white rounded-lg text-gray-600 hover:bg-gray-50 font-semibold transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitting || issuedItems.length === 0}
          onClick={handleConfirmIssue}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing Transaction..." : "Confirm Production Issue"}
        </button>
      </div>
    </div>
  );
};

export default ProductionIssue;