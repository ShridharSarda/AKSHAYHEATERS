import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex-1 flex flex-col">

        <Navbar
          setIsOpen={setIsOpen}
        />

        <main className="p-3 md:p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;