import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails"; 
import ProductCategories from "./components/ProductCategories"; 
import DashboardLayout from "./layouts/DashboardLayout";
import Inward from "./pages/Inward"; 
import FinishedGoods from "./pages/FinishedGoods"; 
import ProductionIssues from "./pages/ProductionIssues";
import TodaysProductionIssues from "./pages/TodaysProductionIssues";
import Vendors from "./pages/Vendors";  
import CustomerOrders from "./pages/CustomerOrders"; 
import OrderDetails from "./pages/OrderDetails"; 
import Dispatch from "./pages/Dispatch"; 
import Orders_pending from "./pages/Orders_pending"; 
import Dispatches from "./pages/Dispatches"; 
import Inwards from "./pages/Inwards"; 
import Customers from "./pages/Customer"; 
import UserManagement from "./pages/UserManagement"; 
import Signup from "./pages/Signup"; // 👈 1. Import your new signup page

// 🔑 IMPORT YOUR UPDATED PROTECTED ROUTE WRAPPER HERE
import ProtectedRoute from "./components/ProtectedRoute"; 
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔒 1. Base Protected Routes (Accessible to any Approved Employee or Admin) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/finished-goods" element={<FinishedGoods />} />
          <Route path="/inward" element={<Inward />} />
          <Route path="/production-issue" element={<ProductionIssues />} />
          <Route path="/todays-production-issues" element={<TodaysProductionIssues />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/order-pending" element={<Orders_pending />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/customers" element={<Customers />} />
          {/* ❌ REMOVED FROM HERE */}
          <Route path="/inwards" element={<Inwards />} />
          <Route path="/dispatches" element={<Dispatches />} />
        </Route>

        {/* 🛑 2. Strict Admin-Only Routes */}
        <Route
          element={
            <ProtectedRoute requireAdmin={true}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/users" element={<UserManagement />} />
          {/* 🟢 ADDED HERE SO ONLY ADMINS CAN ACCESS IT */}
          <Route path="/productDetails" element={<ProductDetails />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;