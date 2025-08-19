import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

// Update navItems for your app structure
const navItems = [
  { key: "link-settings", label: "Link Settings", href: "/LinkSettingsPage" },
  { key: "profile", label: "Profile", href: "/ProfileSettingsPage" },
  { key: "notifications", label: "Notifications", href: "/NotificationsPage" },
  { key: "upgrade", label: "Upgrade", href: "/upgrade" },
  { key: "billing", label: "Billing", href: "/settings/billing" },
];

export default function LeftNav({
  activeKey,
  onChange = () => {},
  isOpen = false,
  onClose = () => {},
  onLogout = () => {},
  userName = "",
}) {
  const location = useLocation();

  // Automatic highlight if parent doesn't pass activeKey
  const highlightKey =
    activeKey ||
    navItems.find((item) => location.pathname.startsWith(item.href))?.key ||
    "";

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
     <nav
  className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-gray-200 bg-white flex-shrink-0 
    overflow-y-auto hide-scrollbar transform transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
  aria-label="Sidebar Navigation"
  style={{ backgroundColor: "#fff" }}
>
        <div className="px-6 py-8 flex flex-col h-full">
          <RouterLink
            to="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-black mb-8 inline-block select-none"
            onClick={onClose}
          >
            &larr; Back to App
          </RouterLink>
          <p className="font-semibold text-xl mb-10 select-none">{userName || ""}</p>
          <ul className="flex-grow space-y-3">
            {navItems.map(({ key, label, href }) => (
              <li key={key}>
                <RouterLink
                  to={href}
                  className={`block px-3 py-2 rounded-lg font-medium text-sm ${
                    highlightKey === key
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                  onClick={() => {
                    onChange(key);
                    onClose();
                  }}
                >
                  {label}
                </RouterLink>
              </li>
            ))}
          </ul>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="mt-12 text-red-600 border border-red-600 px-4 py-2 rounded font-semibold hover:bg-red-600 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
