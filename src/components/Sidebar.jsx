import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// Sidebar navigation items
const navItems = [
  "Digital Cards",
  "Tap/NFC Cards",
  "Networking Toolkit",
  "Contact Book",
  "Analytics",
];

// Utility: Detect mobile
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
      title: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, log me out",
      cancelButtonText: "No, stay logged in",
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
          timerProgressBar: true,
        });
        navigate("/login");
      } catch (err) {
        await Swal.fire({
          title: "Error",
          text: "Failed to logout. Please try again.",
          icon: "error",
        });
      }
    }
  };

  // Settings modal (full-screen overlay on mobile)
  const settingsModal = settingsOpen && (
    <>
      <div
        className="fixed inset-0 z-[99] bg-black bg-opacity-40"
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
          className="w-full text-left py-2 hover:bg-gray-100 rounded px-1 mb-1"
          onClick={() => { setSettingsOpen(false); alert("Upgrade Plan clicked"); }}
        >
          Upgrade Plan
        </button>
        <button
          className="w-full text-left py-2 hover:bg-gray-100 rounded px-1 mb-1"
          onClick={() => { setSettingsOpen(false); navigate("/ProfileSettingsPage"); }}
        >
          Settings
        </button>
        <a
          href=""
          className="block w-full py-2 hover:bg-gray-100 rounded px-1 mb-1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setSettingsOpen(false)}
        >
          Help Center
        </a>
        <a
          href=""
          className="block w-full py-2 hover:bg-gray-100 rounded px-1 mb-1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setSettingsOpen(false)}
        >
          Feature Requests
        </a>
        <a
          href=""
          className="block w-full py-2 hover:bg-gray-100 rounded px-1 mb-1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setSettingsOpen(false)}
        >
          Roadmap
        </a>
        <button
          className="w-full text-left py-2 px-1 text-red-600 border font-semibold hover:bg-red-600 hover:text-white rounded transition"
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
      {/* Sidebar dark overlay for mobile */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 w-64 min-h-screen h-full bg-white
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static
        `}
        style={{
          overflow: "hidden",
          boxShadow: "none",
          WebkitBoxShadow: "none",
          MozBoxShadow: "none",
        }}
      >
        {/* Logo/Header */}
        <div className="py-6 px-6 border-b flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide select-none">SB CARD</h1>
        </div>

        {/* Main nav, scrolls if needed */}
        <nav className="flex-1 flex flex-col overflow-hidden">
          <ul className="flex-1 overflow-y-auto hide-scrollbar">
            {navItems.map((item) => (
              <li
                key={item}
                className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-600 border-l-4 border-transparent hover:border-black font-semibold select-none"
                onClick={() => {
                  if (item === "Digital Cards") {
                    navigate("/dashboard#digital-cards");
                  } else if (item === "Analytics") {
                    navigate("/analytics");
                  } else if (item === "Tap/NFC Cards") {
                    window.open("https://www.sbcard.co.za/product-category/nfc-cards/", "_blank");
                  } else if (item === "Networking Toolkit") {
                    Swal.fire({
                      icon: "info",
                      title: "Page Under Development",
                      text: `"${item}" can't be opened yet. It is still under development.`,
                      confirmButtonText: "OK"
                    });
                  } else if (item === "Contact Book") {
                    navigate("/contacts");
                  } else {
                    alert(`${item} clicked`);
                  }
                  if (isMobile) onClose();
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer: Always visible & pinned */}
        <footer className="p-6 border-t mt-auto select-none bg-white sticky bottom-0 z-10">
          <div className="flex items-center space-x-3">
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
        </footer>
      </aside>
      {/* Full-screen modal for settings */}
      {settingsModal}
    </>
  );
}
