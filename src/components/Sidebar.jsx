import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "sweetalert2/dist/sweetalert2.min.css";

// Navigation items
const navItems = [
  { label: "Digital Cards", path: "/dashboard" },
  { label: "Tap/NFC Cards", external: "https://www.sbcard.co.za/product-category/nfc-cards/" },
   { label: "Contact Book", path: "/contacts" },
  { label: "Analytics", path: "/analytics" }
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

export default function Sidebar({ open, onClose, user, loadingUser }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Logout handler
  const handleLogout = async () => {
    setSettingsOpen(false);
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      cancelButtonText: "No"
    });
    if (result.isConfirmed) {
      try {
        await signOut(auth);
        await Swal.fire({
          title: "Logged out",
          text: "You have been successfully logged out.",
          icon: "success",
          showConfirmButton: false,
          timer: 1200,
          timerProgressBar: true
        });
        navigate("/login");
      } catch (err) {
        await Swal.fire({
          title: "Error",
          text: "Failed to logout. Please try again.",
          icon: "error"
        });
      }
    }
  };

  // Settings modal
  const settingsModal = settingsOpen && (
    <>
      <div
        className="fixed inset-0 z-[99] bg-black/40"
        onClick={() => setSettingsOpen(false)}
        tabIndex={-1}
      />
      <div
        className="fixed left-1/2 z-[100] top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[92vw] max-w-sm space-y-2"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg">Settings & Actions</span>
          <button
            className="font-bold text-lg text-gray-500 hover:text-black"
            onClick={() => setSettingsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
       <button
  className="w-full text-left py-2 px-2 hover:bg-gray-100 rounded mb-1"
  onClick={() => {
    setSettingsOpen(false);
    navigate("/subscription");
  }}
>
  Upgrade Plan
</button>

        <button
          className="w-full text-left py-2 px-2 hover:bg-gray-100 rounded mb-1"
          onClick={() => { setSettingsOpen(false); navigate("/ProfileSettingsPage"); }}
        >
          Settings
        </button>
       
        
     
        <button
          className="w-full text-left py-2 px-2 text-red-600 border font-semibold hover:bg-red-600 hover:text-white rounded transition"
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </div>
    </>
  );

  // Sidebar overlay for mobile
  return (
    <>
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`
          fixed top-0 left-0 z-40 h-full w-64 border-r border-gray-200 bg-white flex-shrink-0 
          overflow-y-auto hide-scrollbar transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static
        `}
        aria-label="Sidebar Navigation"
        style={{ backgroundColor: "#fff" }}
      >
        <div className="px-6 py-8 flex flex-col h-full">
          <h1 className="text-2xl font-bold tracking-wide select-none mb-8">SB CARD</h1>
          <ul className="flex-grow space-y-2 mb-8">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="px-2 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition select-none"
                onClick={() => {
                  if (item.comingSoon) {
                    Swal.fire({
                      icon: "info",
                      title: "Page Under Development",
                      text: `"${item.label}" can't be opened yet. It is still under development.`,
                      confirmButtonText: "OK"
                    });
                  } else if (item.external) {
                    window.open(item.external, "_blank");
                  } else if (item.path) {
                    navigate(item.path);
                  } else {
                    alert(`${item.label} clicked`);
                  }
                  if (isMobile) onClose();
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>

          {/* Profile, settings, logout: always shown under nav */}
          <div className="py-4 px-2 border-t bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="truncate flex-1">
                <span className="font-semibold text-black text-base">
                  {loadingUser ? "..." : user?.name ?? user?.displayName}
                </span>
                <p className="text-xs text-gray-500 truncate">
                  {loadingUser ? "…" : user?.email}
                </p>
              </div>
              <button
                aria-label="Open settings/actions modal"
                onClick={() => setSettingsOpen(true)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
              >
                <FaCog size={20} />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 text-red-600 border border-red-600 px-4 py-2 w-full rounded font-semibold hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      {settingsModal}
    </>
  );
}
