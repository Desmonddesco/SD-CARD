import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { sendPasswordResetEmail, deleteUser, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const navItems = [
  { key: "link-settings", label: "Link Settings", href: "/LinkSettingsPage" },
  { key: "profile", label: "Profile", href: "/ProfileSettingsPage" },
  { key: "notifications", label: "Notifications", href: "/NotificationsPage" },
  { key: "upgrade", label: "Upgrade", href: "/upgrade" },
  { key: "billing", label: "Billing", href: "/settings/billing" },
];
const LeftNav = ({ activeKey, onChange, isOpen, onClose, onLogout, userName }) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto hide-scrollbar transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0`}
        aria-label="Sidebar Navigation"
        style={{ backgroundColor: "#ffffff" }}
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
                    activeKey === key
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
};

const NotificationsPage = () => {
    const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNavKey, setActiveNavKey] = useState("notifications");
 const [formData, setFormData] = useState({
     email: "",
     phone: "",
     website: "",
     linkedin: "",
     address: "",
     name: "",
     company: "",
     jobTitle: "",
     industry: "",
     profilePhoto: "",
   });

  // Notifications toggles
  const [feedback, setFeedback] = useState(""); // Both error and success
    const [feedbackError, setFeedbackError] = useState(false);
  const [emailNotify, setEmailNotify] = useState(true);
  const [whatsappNotify, setWhatsappNotify] = useState(true);

  const profileLink = "link.v1ce.co/twfcqusj";

  useEffect(() => {
  const fetchUser = async () => {
    const curr = auth.currentUser;
    if (!curr) return;
    try {
      const docRef = doc(db, "users", curr.uid);
      const userSnap = await getDoc(docRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setFormData({
          email: data.email || curr.email || "",
          phone: data.phone || "",
          website: data.website || "",
          linkedin: data.linkedin || "",
          address: data.address || "",
          name: data.displayName || data.name || "",
          company: data.company || "",
          jobTitle: data.jobTitle || "",
          industry: data.industry || "",
          profilePhoto: data.profilePhoto || "",
        });
      }
    } catch (err) {
      // handle fetch error if you want
    }
  };
  fetchUser();
}, []);


  // Handlers
  const handleToggleEmail = () => setEmailNotify((prev) => !prev);
  const handleToggleWhatsapp = () => setWhatsappNotify((prev) => !prev);

  const handleTurnOffAll = () => {
    setEmailNotify(false);
    setWhatsappNotify(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert(
      `Settings saved:\nEmail notifications: ${emailNotify ? "ON" : "OFF"}\nWhatsApp notifications: ${
        whatsappNotify ? "ON" : "OFF"
      }`
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    alert("Profile link copied!");
  };
  // LOGOUT: sign out, feedback, redirect to /login
   const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Are you sure you want to logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, log me out',
    cancelButtonText: 'No, stay logged in'
  });

  if (result.isConfirmed) {
    try {
      await signOut(auth);
      await Swal.fire({
        title: 'Logged out',
        text: 'You have been successfully logged out.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1200,
        timerProgressBar: true,
      });
      navigate("/login");
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to logout. Please try again.',
        icon: 'error'
      });
    }
  }
  // If result.isDismissed (user clicked "No"), do nothing (stay logged in)
};


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Hamburger button */}
      <button
        aria-label="Toggle sidebar"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        type="button"
        className="md:hidden fixed top-4 left-4 z-[1000] p-2 rounded-md bg-white border border-gray-300 shadow"
      >
        <svg
          className="h-6 w-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <LeftNav
        activeKey={activeNavKey}
        onChange={setActiveNavKey}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        userName={formData.name}
      />

      {/* Main content */}
      <main
        className="flex-1 p-4 md:p-10 bg-white m-4 md:m-10 ml-0 overflow-y-auto hide-scrollbar relative max-h-screen"
        style={{ paddingTop: "3rem", WebkitOverflowScrolling: "touch" }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-medium mb-8 select-none">Notifications</h1>

          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <a
              href={`https://${profileLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline text-black truncate select-text"
            >
              {profileLink}
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs bg-gray-100 px-3 py-1 rounded mt-2 sm:mt-0"
            >
              Copy Link
            </button>
          </div>

          <p className="mb-6 text-sm text-gray-600 select-none">
            Manage how you receive updates for incoming leads.
          </p>

          <form onSubmit={handleSave} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
            {/* Email Notification Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold select-none">Email</p>
                <p className="text-xs text-gray-600 select-none">
                  Get lead notifications in your email inbox.
                </p>
              </div>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailNotify}
                  onChange={handleToggleEmail}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-black peer-checked:bg-black transition-all"></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    emailNotify ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </label>
            </div>

            {/* WhatsApp Notification Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold select-none">WhatsApp</p>
                <p className="text-xs text-gray-600 select-none">
                  Receive lead updates via WhatsApp.
                </p>
              </div>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={whatsappNotify}
                  onChange={handleToggleWhatsapp}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-black peer-checked:bg-black transition-all"></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    whatsappNotify ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </label>
            </div>

            {/* Turn Off All Notifications Button */}
            <div>
              <button
                type="button"
                onClick={handleTurnOffAll}
                className="text-red-600 border border-red-600 px-4 py-2 rounded font-semibold hover:bg-red-600 hover:text-white transition"
              >
                Turn Off All Notifications
              </button>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-900 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
