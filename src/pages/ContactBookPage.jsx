import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { FaCloudUploadAlt, FaMicrosoft, FaHubspot, FaSalesforce, FaGlobeAmericas } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// Export options for dropdown
const EXPORT_OPTIONS = [
  { label: "CSV for Excel/Sheets", value: "csv" },
  { label: "Microsoft Dynamics 365", value: "dynamics", icon: <FaMicrosoft /> },
  { label: "Salesforce CRM", value: "salesforce", icon: <FaSalesforce /> },
  { label: "HubSpot CRM", value: "hubspot", icon: <FaHubspot /> },
  { label: "Zoho CRM", value: "zoho", icon: <FaGlobeAmericas /> },
];

// CSV export utility
function exportLeadsToCSV(leads, filename = "leads.csv") {
  if (!leads.length) return;
  const header = ["Name", "Email", "Phone", "Message", "Card", "Received"];
  const rows = leads.map(lead =>
    [lead.name, lead.email, lead.phone, lead.message, lead.cardName, lead.createdAt]
      .map(field => `"${field || ""}"`).join(",")
  );
  const csvContent = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export dropdown component
function ExportDropdown({ leads, disabled }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();

  function handleDropdownExport(option) {
    setOpen(false);
    if (option.value === "csv") {
      exportLeadsToCSV(leads);
    } else {
      Swal.fire({
        icon: "info",
        title: "Integration Coming Soon!",
        text: `API integration with ${option.label} is coming soon.`,
        timer: 3500,
        showConfirmButton: false,
      });
    }
  }

  return (
    <div className="relative" ref={btnRef}>
      <button
        className="flex items-center gap-2 px-5 py-2 rounded shadow bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-indigo-700 hover:to-blue-700 transition font-semibold text-base"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        type="button"
      >
        <FaCloudUploadAlt /> Export
      </button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[200px] bg-white border border-gray-200 rounded shadow-lg z-40 text-sm animate-fade-in">
          {EXPORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-blue-50 transition border-b last:border-0"
              onClick={() => handleDropdownExport(opt)}
            >
              {opt.icon && <span>{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContactBookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
        }
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    });
    return unsubscribe;
  }, []);

  // Retrieve all leads
  useEffect(() => {
    async function fetchLeads() {
      if (!user) return;
      const cardsRef = collection(db, "cards");
      const cardsSnap = await getDocs(query(cardsRef, where("userId", "==", user.uid)));
      let allLeads = [];
      for (const cardDoc of cardsSnap.docs) {
        const cardName = cardDoc.data().name || "";
        const leadsRef = collection(db, "cards", cardDoc.id, "leads");
        const leadsSnap = await getDocs(leadsRef);
        leadsSnap.forEach(leadDoc => {
          const data = leadDoc.data();
          allLeads.push({
            id: leadDoc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
            cardName,
            createdAt: data.createdAt?.toDate()?.toLocaleString() || "",
          });
        });
      }
      setLeads(allLeads);
    }
    fetchLeads();
  }, [user]);

  const isPremium = user && (user.subscription === "premium" || user.subscription === "admin");

  const displayedLeads = leads.filter(lead =>
    !search ||
    (lead.name && lead.name.toLowerCase().includes(search.toLowerCase())) ||
    (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
    (lead.phone && lead.phone.toLowerCase().includes(search.toLowerCase())) ||
    (lead.message && lead.message.toLowerCase().includes(search.toLowerCase())) ||
    (lead.cardName && lead.cardName.toLowerCase().includes(search.toLowerCase()))
  );

  // Upgrade restriction notice
  const handleUpgradeToast = (popupText = "Upgrade your plan to use this feature!", position = "top-end") => {
    Swal.fire({
      toast: true,
      title: popupText,
      icon: "info",
      position,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      background: "#fff",
      color: "#111",
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  if (loadingUser) return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>;
  if (!user) return <div className="flex items-center justify-center h-screen text-lg">Please log in to view your leads.</div>;

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between bg-white border-b p-4 md:hidden shadow-sm">
          <button
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-blue-100 transition"
          >
            <svg width={22} height={22} fill="currentColor">
              <rect width="100%" height="4" y="2" rx="2" />
              <rect width="100%" height="4" y="9" rx="2" />
              <rect width="100%" height="4" y="16" rx="2" />
            </svg>
          </button>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-black text-base">{user?.name ?? user?.displayName}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8 bg-gradient-to-tl from-blue-100/40 to-white">
          <div className="flex flex-col md:flex-row md:justify-between mb-8 items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-gray-800">Captured Leads</h1>
              <div className="text-gray-500 text-sm">
                Manage all inbound leads submitted through your digital cards and easily export the data to Excel, or your CRM of choice.
              </div>
            </div>
            <ExportDropdown
              leads={leads}
              disabled={!isPremium}
            />
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-7">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm"
              placeholder="Search by name, email, phone, card, or message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => {
                if (!isPremium) handleUpgradeToast("Upgrade to search leads!", "top-end");
              }}
              readOnly={!isPremium}
            />
          </div>

          {/* Leads Table */}
          <div className="relative w-full">
            <div className={"rounded-xl shadow bg-white p-2 sm:p-4" + (!isPremium ? " blur-sm select-none pointer-events-none" : "")}>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs font-semibold text-gray-500 border-b pb-2 mb-2">
                <span>Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Message</span>
                <span>Card</span>
                <span>Received</span>
              </div>
              {displayedLeads.length === 0 ? (
                <div className="w-full flex flex-col items-center py-20">
                  <svg width={64} height={64} className="mb-4 text-indigo-300" viewBox="0 0 64 64" fill="none">
                    <rect x="8" y="20" width="48" height="36" rx="4" fill="#E0E7FF" />
                    <rect x="22" y="34" width="20" height="4" rx="2" fill="#A5B4FC" />
                    <rect x="22" y="42" width="16" height="2" rx="1" fill="#A5B4FC" />
                    <rect x="18" y="28" width="28" height="2" rx="1" fill="#A5B4FC" />
                  </svg>
                  <div className="text-lg font-semibold text-gray-700 mb-2">No leads yet!</div>
                  <div className="text-gray-500 mb-4 text-center max-w-xs">
                    As people connect, all lead details appear here from your digital cards.
                  </div>
                </div>
              ) : (
                displayedLeads.map(lead => (
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs items-center py-2 border-b last:border-b-0" key={lead.id}>
                    <span className="font-semibold text-gray-900">{lead.name}</span>
                    <span className="truncate">{lead.email}</span>
                    <span className="truncate">{lead.phone}</span>
                    <span className="truncate">{lead.message}</span>
                    <span className="truncate text-indigo-700">{lead.cardName}</span>
                    <span className="text-gray-500">{lead.createdAt}</span>
                  </div>
                ))
              )}
            </div>
            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-white/60 backdrop-blur-sm rounded w-full h-full pointer-events-none" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-black text-sm font-medium bg-white/90 rounded px-4 py-2 shadow pointer-events-auto">
                    Upgrade to Premium to access leads!
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
