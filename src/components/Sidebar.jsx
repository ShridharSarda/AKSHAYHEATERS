import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxes,
  FaTruck,
  FaUsers,
  FaBuilding,
  FaChartBar,
  FaCog,
  FaShoppingCart,
  FaArrowDown,
  FaIndustry,
  FaWarehouse,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

const navGroups = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" }],
  },
  {
    label: "Inventory",
    items: [
      { name: "Products", icon: <FaBoxes />, path: "/Products" },
      { name: "Finished Goods", icon: <FaWarehouse />, path: "/finished-goods" },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "Customers", icon: <FaUsers />, path: "/customers" },
      { name: "Customer Orders", icon: <FaShoppingCart />, path: "/orders" },
      { name: "Vendors", icon: <FaBuilding />, path: "/vendors" },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Inward Entries", icon: <FaArrowDown />, path: "/inward" },
      { name: "Production Issue", icon: <FaIndustry />, path: "/production-issue" },
      { name: "Dispatch", icon: <FaTruck />, path: "/dispatch" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Reports", icon: <FaChartBar />, path: "/reports" },
      { name: "Settings", icon: <FaCog />, path: "/settings" },
    ],
  },
];

function Sidebar({ isOpen, setIsOpen }) {
  // Desktop-only icon rail mode, remembered across visits
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ah-sidebar-collapsed") === "true"
  );

  useEffect(() => {
    localStorage.setItem("ah-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Lock background scroll on mobile while the drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-slate-950 text-slate-200 transition-all duration-300 ease-in-out md:relative ${
          collapsed ? "md:w-20" : "md:w-72"
        } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand */}
        <div
          className={`flex h-16 flex-shrink-0 items-center gap-3 border-b border-slate-800/80 px-5 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Akshay Heaters</p>
              <p className="truncate text-xs text-slate-500">Manufacturing ERP</p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors ${
                          collapsed ? "md:justify-center" : ""
                        } ${
                          isActive
                            ? "bg-indigo-500/10 text-white"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-indigo-500 transition-opacity ${
                              isActive ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span
                            className={`flex-shrink-0 text-base ${
                              isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          >
                            {item.icon}
                          </span>
                          {!collapsed && <span className="truncate">{item.name}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Collapse toggle, desktop only */}
        <div className="hidden flex-shrink-0 border-t border-slate-800/80 p-3 md:flex">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <FaChevronRight />
            ) : (
              <>
                <FaChevronLeft />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;