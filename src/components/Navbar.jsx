import {
  FaBars,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

function Navbar({ setIsOpen }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm">

      <div className="flex items-center gap-4">

        <button
          className="md:hidden text-xl"
          onClick={() => setIsOpen(true)}
        >
          <FaBars />
        </button>

        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
          Dashboard
        </h2>

      </div>

      <div className="flex items-center gap-5">

        <button className="relative">
          <FaBell className="text-gray-600 text-lg" />

          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1 rounded-full">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle className="text-3xl text-gray-600" />

          <div className="hidden md:block">
            <p className="text-sm font-medium">
              Admin
            </p>

            <p className="text-xs text-gray-500">
              Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}

export default Navbar;