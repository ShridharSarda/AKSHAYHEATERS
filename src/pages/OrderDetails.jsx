import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { arrayUnion } from "firebase/firestore";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [newDispatchQty, setNewDispatchQty] = useState(0);

  const handleAddDispatch = async () => {
    const dispatchRecord = {
      qty: Number(newDispatchQty),
      date: Timestamp.now(),
    };

    const updatedHistory = [...(order.dispatchHistory || []), dispatchRecord];
    const totalDispatched = updatedHistory.reduce((sum, item) => sum + item.qty, 0);
    
    // ✅ Calculate correct status based on quantities
    const updatedStatus = totalDispatched >= order.qty ? "Dispatched" : "In Production";

    try {
      await updateDoc(doc(db, "orders", id), {
        dispatchHistory: arrayUnion(dispatchRecord),
        dispatchedQty: totalDispatched,
        status: updatedStatus
      });
      
      // Refresh local state
      setOrder({ 
        ...order, 
        dispatchHistory: updatedHistory, 
        dispatchedQty: totalDispatched,
        status: updatedStatus
      });
      setNewDispatchQty(0);
      alert("Dispatch recorded!");
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const docRef = doc(db, "orders", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({ id: docSnap.id, ...data });
      }
    };
    fetchOrder();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "orders", id), {
        woNo: order.woNo || "",
        customer: order.customer || "",
        poNo: order.poNo || "",
        product: order.product || "",
        specification: order.specification || "",
        qty: Number(order.qty || 0),
        dispatchedQty: Number(order.dispatchedQty || 0),
        status: order.status || "Pending", // ✅ Preserves status correctly
        orderDate: order.orderDate,
        items: order.items || [] 
      });
      alert("Order Updated Successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (!order) {
    return <div className="p-10 text-center">Loading Order Details...</div>;
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-black font-semibold text-sm"
      >
        <FaArrowLeft /> BACK
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ORDER INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <h3 className="bg-slate-100 p-3 text-[10px] font-bold uppercase tracking-widest border-b text-slate-600">
            Order Information
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400 w-1/3">WO No</td>
                <td className="p-3 border-b">
                  <input
                    className="w-full bg-slate-50 p-2 rounded border focus:outline-indigo-500"
                    value={order.woNo || ""}
                    onChange={(e) => setOrder({ ...order, woNo: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400">Customer</td>
                <td className="p-3 border-b">
                  <input
                    className="w-full bg-slate-50 p-2 rounded border focus:outline-indigo-500"
                    value={order.customer || ""}
                    onChange={(e) => setOrder({ ...order, customer: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400">PO Number</td>
                <td className="p-3 border-b">
                  <input
                    className="w-full bg-slate-50 p-2 rounded border focus:outline-indigo-500"
                    value={order.poNo || ""}
                    onChange={(e) => setOrder({ ...order, poNo: e.target.value })}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-400">Order Date</td>
                <td className="p-3">
                  <input
                    type="date"
                    className="w-full bg-slate-50 p-2 rounded border focus:outline-indigo-500"
                    value={order.orderDate?.toDate ? order.orderDate.toDate().toISOString().split("T")[0] : ""}
                    onChange={(e) => setOrder({ ...order, orderDate: Timestamp.fromDate(new Date(e.target.value)) })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PRODUCT SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <h3 className="bg-slate-100 p-3 text-[10px] font-bold uppercase tracking-widest border-b text-slate-600">
            Product Summary
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400 w-1/3">Product</td>
                <td className="p-3 border-b font-semibold text-slate-800">{order.product || "-"}</td>
              </tr>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400">Ordered Qty</td>
                <td className="p-3 border-b text-blue-600 font-bold">{order.qty || 0}</td>
              </tr>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400">Dispatched Qty</td>
                <td className="p-3 border-b text-green-600 font-bold">{order.dispatchedQty || 0}</td>
              </tr>
              <tr>
                <td className="p-3 border-b font-bold text-slate-400">Pending Qty</td>
                <td className="p-3 border-b text-orange-600 font-bold">{(order.qty || 0) - (order.dispatchedQty || 0)}</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-400">Status</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === "Dispatched" ? "bg-green-100 text-green-800" : 
                    order.status === "In Production" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {order.status || "Pending"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH CONTROL PANEL */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Log Dispatch Run</h3>
        <div className="flex gap-4">
          <input 
            type="number" 
            placeholder="Quantity to Dispatch"
            className="p-2.5 border rounded-lg w-64 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newDispatchQty === 0 ? "" : newDispatchQty} 
            onChange={(e) => setNewDispatchQty(e.target.value)}
          />
          <button onClick={handleAddDispatch} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm">
            Add Entry
          </button>
        </div>
      </div>

      {/* CUSTOMER ORDER ITEMS BREAKDOWN */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <h3 className="bg-slate-100 p-3 text-[10px] font-bold uppercase tracking-widest border-b text-slate-600">
          Order Items
        </h3>
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b">
            <tr>
              <th className="p-4 w-16 text-center">#</th>
              <th className="p-4">Specification</th>
              <th className="p-4 text-right">Ordered Qty</th>
              <th className="p-4 text-right">Dispatched Qty</th>
              <th className="p-4 text-right">Pending Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-center text-slate-400 font-medium">{index + 1}</td>
                  <td className="p-4 text-slate-700 font-medium">{item.specification || "-"}</td>
                  <td className="p-4 text-right text-slate-900 font-medium">{item.qty || 0}</td>
                  <td className="p-4 text-right text-slate-500">{item.dispatchedQty || 0}</td>
                  <td className="p-4 text-right text-orange-600 font-semibold">{Number(item.qty || 0) - Number(item.dispatchedQty || 0)}</td>
                </tr>
              ))
            ) : (
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-center text-slate-400 font-medium">1</td>
                <td className="p-4 text-slate-700 font-medium">{order.specification || order.product || "-"}</td>
                <td className="p-4 text-right text-slate-900 font-medium">{order.qty || 0}</td>
                <td className="p-4 text-right text-slate-500">{order.dispatchedQty || 0}</td>
                <td className="p-4 text-right text-orange-600 font-semibold">{(order.qty || 0) - (order.dispatchedQty || 0)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleUpdate}
        className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-md"
      >
        <FaSave /> SAVE ALL CHANGES
      </button>
    </div>
  );
};

export default OrderDetails;