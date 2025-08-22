import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { sendPasswordResetEmail, deleteUser, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import LeftNav from "../components/LeftNav";


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

  const profileLink = "link.co/twfcqusj";

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
  className="flex-1 p-4 md:p-10 bg-white m-4 md:m-10 ml-0 md:ml-64 overflow-y-auto hide-scrollbar relative max-h-screen"
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
