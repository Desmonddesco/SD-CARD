import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Adjust path if needed
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Swal from 'sweetalert2'; // Make sure sweetalert2 is installed
import 'sweetalert2/dist/sweetalert2.min.css';

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};


const Sidebar = ({ open, onClose, user, loadingUser }) => {
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
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


  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setMenuOpen(open);
  }, [open, isMobile]);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, isMobile]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isMobile) setMenuOpen((v) => !v);
    }
  };

  const userMenuContentMobile = (
    <ul
      role="menu"
      className="mt-4 max-h-[60vh] overflow-y-auto hide-scrollbar rounded-none border border-gray-300 bg-white shadow-md w-full"
      tabIndex={-1}
    >
      {[
        { label: "Upgrade Plan", action: () => alert("Upgrade Plan clicked") },
        { label: "Settings", action: () => {
          setMenuOpen(false);
          navigate("/ProfileSettingsPage");
        } },
        { label: "Help Center", href: "https://app.v1ce.co/help" },
        { label: "Feature Requests", href: "https://app.v1ce.co/help/feature-requests" },
        { label: "Roadmap", href: "https://app.v1ce.co/help/roadmap" },
       { label: "Logout", action: handleLogout, isLogout: true },
      ].map(({ label, action, href, isLogout }, idx) =>
        isLogout ? (
          <li
            key={idx}
            role="menuitem"
            tabIndex={0}
            className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-red-600 border-l-4 border-transparent hover:border-black font-semibold select-none"
            onClick={() => { action && action(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") action && action(); }}
          >
            {label}
          </li>
        ) : href ? (
          <li
            key={idx}
            role="menuitem"
            tabIndex={0}
            className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-600 border-l-4 border-transparent hover:border-black font-semibold select-none"
            onClick={() => { window.open(href, "_blank", "noopener"); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") window.open(href, "_blank", "noopener"); }}
          >
            {label}
          </li>
        ) : (
          <li
            key={idx}
            role="menuitem"
            tabIndex={0}
            className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-600 border-l-4 border-transparent hover:border-black font-semibold select-none"
            onClick={() => { action && action(); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") action && action(); }}
          >
            {label}
          </li>
        )
      )}
    </ul>
  );

  const userMenuContentDesktop = (
    <>
      <div className="border-b border-gray-300 px-4 py-2 font-semibold text-black select-none">
        ACCOUNT
      </div>
      <button
        tabIndex={0}
        className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2 focus:outline-none focus:bg-gray-100"
        onClick={() => {
          setMenuOpen(false);
          alert("Upgrade Plan clicked");
        }}
      >
        Upgrade Plan
      </button>
      <button
        tabIndex={0}
        className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2 focus:outline-none focus:bg-gray-100"
        onClick={() => {
          setMenuOpen(false);
          navigate("/ProfileSettingsPage");
        }}
      >
        Settings
      </button>
      <div className="border-t border-b border-gray-300 px-4 py-2 mt-2 font-semibold text-black select-none">
        SUPPORT
      </div>
      <a href="https://app.v1ce.co/help"
        target="_blank" rel="noopener noreferrer"
        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
      >
        Help Center
      </a>
      <a href="https://app.v1ce.co/help/feature-requests"
        target="_blank" rel="noopener noreferrer"
        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
      >
        Feature Requests
      </a>
      <a href="https://app.v1ce.co/help/roadmap"
        target="_blank" rel="noopener noreferrer"
        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
      >
        Roadmap
      </a>
     <button
  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
  onClick={handleLogout}
  type="button"
>
  Logout
</button>

    </>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out overflow-y-auto hide-scrollbar
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex md:flex-col`}
      >
        <div className="py-6 px-6 border-b flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide select-none">SB CARD</h1>
        </div>
        <nav className="mt-6 flex-1 flex flex-col overflow-hidden">
          <ul className="flex-1 overflow-auto hide-scrollbar">
            {[
              "Digital Cards",
              "Tap/NFC Cards",
              "Networking Toolkit",
              "Contact Book",
              "Analytics",
            ].map((item) => (
              <li
                key={item}
                className="px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-600 border-l-4 border-transparent hover:border-black font-semibold select-none"
              >
                {item}
              </li>
            ))}
          </ul>
          {isMobile && menuOpen && userMenuContentMobile}
        </nav>
        {!isMobile && (
          <footer className="p-6 border-t relative select-none">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {loadingUser
                  ? "..."
                  : user?.displayName?.[0]?.toUpperCase() || "U"}
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
                ref={buttonRef}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Open settings menu"
                onClick={() => setMenuOpen((v) => !v)}
                onKeyDown={handleKeyDown}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
                tabIndex={0}
              >
                <FaCog size={20} />
              </button>
            </div>
          </footer>
        )}
      </aside>
      {!isMobile && menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-lg w-60 border border-gray-300 py-2 max-h-[70vh] overflow-y-auto hide-scrollbar"
          style={{
            bottom: "5rem",
            left: "16rem",
            minWidth: "15rem",
          }}
          role="menu"
          aria-label="User settings menu"
        >
          {userMenuContentDesktop}
        </div>
      )}
    </>
  );
};

const Card = ({ title, isPublished, onPublish, onEdit }) => (
  <div className="border rounded-lg bg-white shadow-sm p-4 flex flex-col">
    <div className="mb-3 bg-gray-200 h-24 flex items-center justify-center rounded cursor-pointer hover:bg-gray-300 select-none">
      <span className="text-gray-500">{title} Preview</span>
    </div>
    <div className="mb-2 text-sm font-bold flex justify-between items-center">
      <p className="truncate">{title}</p>
      {!isPublished && (
        <span className="text-xxs text-gray-400 bg-gray-100 px-1 rounded select-none">
          Unpublished
        </span>
      )}
    </div>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onPublish}
        className="bg-gray-100 py-1 px-3 rounded text-xs hover:bg-gray-200 transition w-full sm:w-auto"
        type="button"
      >
        Publish
      </button>
      <button
        onClick={onEdit}
        className="bg-gray-100 py-1 px-3 rounded text-xs hover:bg-gray-200 transition w-full sm:w-auto"
        type="button"
      >
        Edit
      </button>
    </div>
  </div>
);

const NetworkingTool = ({ title, description }) => (
  <div
    className="bg-white p-4 rounded-lg shadow-sm border flex flex-col items-center justify-center text-center hover:bg-gray-100 cursor-pointer relative select-none"
    tabIndex={0}
    role="button"
    aria-label={`${title}, Upgrade feature`}
  >
    <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 rounded select-none">
      Upgrade
    </span>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ displayName: "Guest", email: "guest@example.com" });
  const [loadingUser, setLoadingUser] = useState(true);

  const cards = [
    { id: 1, title: "Whatsapp", isPublished: false },
    { id: 2, title: "Linktree", isPublished: false },
    { id: 3, title: "Contact Card", isPublished: false },
    { id: 4, title: "Email", isPublished: false },
  ];
  const networkingTools = [
    { id: 1, title: "Email Signature", description: "Share your info..." },
    { id: 2, title: "Auto Follow-Up", description: "Automate follow-up..." },
    { id: 3, title: "Virtual Background", description: "Create a virtual..." },
    { id: 4, title: "Connect Your CRM", description: "Sync with your CRM..." },
    { id: 5, title: "Add to Wallet", description: "Save your card in phone." },
    { id: 6, title: "AI Business Card Scanner", description: "Scan and save info." },
  ];

  // --- Use an auth-state listener for always-up-to-date info ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (curr) => {
      setLoadingUser(true);
      if (!curr) {
        setUser({ displayName: "Guest", email: "guest@example.com" });
        setLoadingUser(false);
        return;
      }
      try {
        const ref = doc(db, "users", curr.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUser({
            displayName: data.displayName || data.name || "User",
            email: data.email || curr.email,
          });
        } else {
          setUser({ displayName: curr.displayName || "User", email: curr.email });
        }
      } finally {
        setLoadingUser(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar & backdrop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />

      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile ONLY */}
        <header className="flex items-center justify-between bg-white border-b p-4 md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 transition"
          >
            <FaBars className="text-lg" />
          </button>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-black text-base">
              {loadingUser ? "..." : user.displayName}
            </span>
            <span className="text-xs text-gray-600">
              {loadingUser ? "..." : user.email}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
            {(user.displayName?.[0] || "U").toUpperCase()}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {/* Desktop greeting header */}
          <header className="mb-6 hidden md:flex justify-between items-center">
           <div>
            <h1 className="text-2xl font-semibold truncate">
              WELCOME, {loadingUser ? "" : (user.displayName?.split(" ")[0] || "User").toUpperCase()}
             </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
              {(user.displayName?.[0] || "U").toUpperCase()}
            </div>
          </header>

          {/* Digital Cards Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Digital Cards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div
                className="border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer p-6 bg-white hover:bg-gray-100 select-none"
                tabIndex={0}
                role="button"
                aria-label="Create Digital Card"
                onClick={() => navigate("/digital-card-editor")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") alert("Create Digital Card clicked");
                }}
              >
                <div className="text-blue-500 text-5xl mb-2 font-bold">+</div>
                <p className="text-sm font-semibold">Create Digital Card</p>
              </div>

              {cards.map(({ id, title, isPublished }) => (
                <Card
                  key={id}
                  title={title}
                  isPublished={isPublished}
                  onPublish={() => alert(`Publish ${title}`)}
                  onEdit={() => alert(`Edit ${title}`)}
                />
              ))}
            </div>
          </section>

          {/* Networking Toolkit Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Networking Toolkit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {networkingTools.map(({ id, title, description }) => (
                <NetworkingTool key={id} title={title} description={description} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
