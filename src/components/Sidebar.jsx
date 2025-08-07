// components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaCog } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// Menu items (adjust href, keys to your routes)
const navItems = [
  { key: "digital-cards", label: "Digital Cards", href: "/dashboard" },
  { key: "card-editor", label: "Card Editor", href: "/digital-card-editor" },
  { key: "profile", label: "Profile", href: "/ProfileSettingsPage" },
  { key: "notifications", label: "Notifications", href: "/NotificationsPage" },
  { key: "upgrade", label: "Upgrade", href: "/upgrade" },
  { key: "billing", label: "Billing", href: "/settings/billing" },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};

const Sidebar = ({
  open,
  onClose = () => {},
  user,
  loadingUser,
  activeKey,
  onNavChange = () => {},
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Highlight nav based on URL path if activeKey not passed
  const currentKey =
    activeKey ||
    navItems.find((item) => location.pathname.startsWith(item.href))?.key ||
    "";

  // Mobile user/account menu logic (optional, like dashboard)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Universal Logout with SweetAlert2
  const handleLogout = async () => {
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

  // Render
  return (
    <>
      {/* Mobile overlay */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          aria-hidden="true"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={
          `fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-lg ` +
          `transform transition-transform duration-300 ease-in-out ` +
          `${open || !isMobile ? "translate-x-0" : "-translate-x-full"}`
        }
        style={{ minWidth: 256 }}
      >
        <div className="py-6 px-6 border-b flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide select-none">
            SB CARD
          </h1>
          <button
            className="md:hidden block text-2xl text-gray-500"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        {/* Menu */}
        <nav className="mt-4 flex-1 flex flex-col overflow-hidden">
          <ul className="flex-1 overflow-auto hide-scrollbar">
            {navItems.map(({ key, label, href }) => (
              <li key={key}>
                <button
                  className={
                    "w-full text-left px-6 py-3 font-semibold flex items-center" +
                    " " +
                    (currentKey === key
                      ? "text-white bg-black rounded-lg"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black rounded-lg")
                  }
                  style={{
                    borderLeft:
                      currentKey === key ? "4px solid #111" : "4px solid transparent",
                    transition: "background .18s",
                  }}
                  onClick={() => {
                    if (isMobile) onClose();
                    onNavChange(key);
                    navigate(href);
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          {/* Optional: Upgrade, Billing, Settings can be pulled out as blocks for emphasis */}
        </nav>
        {/* Account info & logout */}
        <footer className="p-6 border-t flex items-center gap-3 select-none">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
            {loadingUser ? "..." : user?.displayName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="truncate flex-1">
            <p className="text-sm font-semibold truncate">
              {loadingUser ? "..." : user?.displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {loadingUser ? "..." : user?.email}
            </p>
          </div>
          <button
            aria-label="Logout"
            onClick={handleLogout}
            className="text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded p-2 transition ml-1"
            style={{ minWidth: 32, minHeight: 32 }}
            type="button"
          >
            Logout
          </button>
        </footer>
      </aside>
    </>
  );
};

export default Sidebar;
