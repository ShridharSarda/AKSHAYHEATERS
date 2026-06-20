import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails"; // 🟢 ADDED: Import your details page
import ProductCategories from "./components/ProductCategories"; // 👈 Add this line!
import DashboardLayout from "./layouts/DashboardLayout";

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
           

          {/* 🟢 ADDED: Route for viewing single product info */}
          <Route
            path="/productDetails"
            element={<ProductDetails />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;