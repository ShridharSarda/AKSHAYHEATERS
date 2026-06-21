import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails"; // 🟢 ADDED: Import your details page
import ProductCategories from "./components/ProductCategories"; // 👈 Add this line!
import DashboardLayout from "./layouts/DashboardLayout";
import Inward from "./pages/Inward"; // 1. Import your new Inward component
import FinishedGoods from "./pages/FinishedGoods"; // Adjust path if needed
import ProductionIssues from "./pages/ProductionIssues";
import TodaysProductionIssues from "./pages/TodaysProductionIssues";
import Vendors from "./pages/Vendors";  
import CustomerOrders from "./pages/CustomerOrders"; // Adjust path if needed
import OrderDetails from "./pages/OrderDetails"; // Adjust path if needed 
import Dispatch from "./pages/Dispatch"; // Adjust path if needed
import Orders_pending from "./pages/Orders_pending"; // Adjust path if needed
import Dispatches from "./pages/Dispatches"; // ✅ UPDATED: Plural component name matching dashboard
import Inwards from "./pages/Inwards"; // ✅ UPDATED: Plural component name matching dashboard
import Customers from "./pages/Customer"; // Adjust path if needed
import UserManagement from "./pages/UserManagement"; // Double check if your file is in pages/ or components/

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/products"
            element={<Products />}
          />
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
            <Route path="/users" element={<UserManagement />} />
          <Route
            path="/productDetails"
            element={<ProductDetails />}
          />
          <Route path="/inwards" element={<Inwards />} />
          <Route path="/dispatches" element={<Dispatches />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;