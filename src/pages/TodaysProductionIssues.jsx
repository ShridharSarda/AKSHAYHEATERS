import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaArrowLeft } from "react-icons/fa";

const TodaysProductionIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaysIssues = async () => {
    try {
      setLoading(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "production_issues"),
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay)
      );

      const querySnapshot = await getDocs(q);
      const issuesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort with newest dispatches on top
      issuesData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setIssues(issuesData);
    } catch (error) {
      console.error("Error fetching today's production issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysIssues();
  }, []);

  return (
    <div className="p-6 space-y-6 text-gray-800 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <button 
        onClick={() => navigate("/dashboard")}
        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 group"
      >
        <FaArrowLeft className="transform group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
      </button>

      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FaHistory className="text-amber-500" /> Today's Production Dispatches
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live historical log of materials issued to the production floor today.
          </p>
        </div>
        <button
          onClick={fetchTodaysIssues}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
        >
          Refresh Logs
        </button>
      </div>

      {/* Main List Box Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm font-medium">Loading live logs...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            No production issues have been submitted or recorded today yet.
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-gray-200/60 pb-2">
                  <div>
                    <span className="text-sm font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-3xs">
                      {issue.issueNo}
                    </span>
                    <span className="ml-3 text-sm text-gray-500 font-medium">
                      Purpose: <span className="text-gray-800 font-semibold">{issue.purpose}</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-bold bg-white px-2 py-1 rounded border border-gray-100">
                    🕒 {issue.createdAt?.toDate ? new Date(issue.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>
                </div>

                {/* Grid layout containing item lines attached */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {issue.items?.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-lg p-2.5 flex justify-between items-center shadow-3xs">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-blue-600 block">{item.itemCode}</span>
                        <span className="text-xs text-gray-700 font-medium truncate block">{item.name}</span>
                      </div>
                      <span className="bg-blue-50 text-blue-700 font-bold text-sm px-2.5 py-1 rounded-md min-w-[3.5rem] text-center border border-blue-100">
                        {item.quantity} <span className="text-[10px] font-normal text-blue-500">{item.uom}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysProductionIssues;