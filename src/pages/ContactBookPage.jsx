import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaCloudUploadAlt, FaMicrosoft, FaHubspot, FaSalesforce, FaGlobeAmericas,
  FaEdit, FaTrash, FaPlus, FaTimes
} from "react-icons/fa";
import { auth, db } from "../firebase";
import {
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ===================== Export Destinations =====================
const EXPORT_OPTIONS = [
  { label: "CSV for Excel/Sheets", value: "csv", icon: null },
  { label: "Microsoft Dynamics 365", value: "dynamics", icon: <FaMicrosoft /> },
  { label: "Salesforce CRM", value: "salesforce", icon: <FaSalesforce /> },
  { label: "HubSpot CRM", value: "hubspot", icon: <FaHubspot /> },
  { label: "Zoho CRM", value: "zoho", icon: <FaGlobeAmericas /> },
];

// ===================== Helpers =====================
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

async function uploadToHubspot(leads) {
  if (!leads.length) {
    Swal.fire({ icon: "warning", title: "No leads to upload" });
    return;
  }
  const apiKey = "HUBSPOT_API_KEY"; // demo; use OAuth server flow in production
  const inputs = leads.map(lead => ({
    properties: {
      email: lead.email || "",
      firstname: lead.name?.split(" ") || "",
      lastname: lead.name?.split(" ").slice(1).join(" ") || "",
      phone: lead.phone || "",
      lifecyclestage: "lead",
      notes: lead.message || "",
      company: lead.cardName || ""
    }
  }));

  try {
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/batch/create?hapikey=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs })
    });
    if (!res.ok) {
      const err = await res.json();
      Swal.fire({ icon: "error", title: "HubSpot upload failed", text: err.message || "Please try again" });
      return;
    }
    Swal.fire({ icon: "success", title: "Leads uploaded to HubSpot successfully!" });
  } catch (error) {
    Swal.fire({ icon: "error", title: "HubSpot upload error", text: error.message || "Please try again" });
  }
}

// ===================== Centered Export Modal =====================
function ExportControl({ leads, selectedLeads, disabled }) {
  const [open, setOpen] = useState(false);
  const payload = useMemo(() => (selectedLeads?.length ? selectedLeads : leads), [leads, selectedLeads]);

  function choose(option) {
    if (option.value === "csv") exportLeadsToCSV(payload);
    else if (option.value === "hubspot") uploadToHubspot(payload);
    else Swal.fire({ icon: "info", title: "Integration Coming Soon!", text: `API integration with ${option.label} is coming soon.`, timer: 3500, showConfirmButton: false });
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded shadow bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-indigo-700 hover:to-blue-700 transition font-semibold text-sm"
      >
        <FaCloudUploadAlt /> Export{selectedLeads?.length ? ` (${selectedLeads.length})` : ""}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <div className="text-base font-bold">Export Contacts</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedLeads?.length ? `${selectedLeads.length} selected` : `Exporting all (${leads.length})`}
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <div className="py-2">
                {EXPORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-blue-50 transition border-b last:border-0"
                    onClick={() => choose(opt)}
                  >
                    {opt.icon && <span className="text-gray-700">{opt.icon}</span>}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 border-t flex justify-end">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ===================== Add Contact Modal =====================
function AddLeadModal({ open, onClose, cards, onCreate }) {
  const [form, setForm] = useState({ cardId: "", name: "", email: "", phone: "", message: "" });
  useEffect(() => { if (open) setForm({ cardId: "", name: "", email: "", phone: "", message: "" }); }, [open]);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-5 py-4 border-b">
            <div className="text-base font-bold">Add Contact</div>
            <div className="text-xs text-gray-500 mt-1">Select a card and enter contact info.</div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <select
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
              value={form.cardId}
              onChange={e => setForm({ ...form, cardId: e.target.value })}
            >
              <option value="" disabled>Select your card</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.name || "Untitled Card"}</option>
              ))}
            </select>
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Name" value={form.name}
                   onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Email" type="email" value={form.email}
                   onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Phone" value={form.phone}
                   onChange={e => setForm({ ...form, phone: e.target.value })} />
            <textarea rows={3} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                      placeholder="Message" value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="px-5 py-3 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => onCreate(form)} className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===================== Edit Contact Modal =====================
function EditLeadModal({ open, onClose, lead, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  useEffect(() => { if (open) setForm({
    name: lead?.name || "", email: lead?.email || "", phone: lead?.phone || "", message: lead?.message || ""
  }); }, [open, lead]);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-5 py-4 border-b">
            <div className="text-base font-bold">Edit Contact</div>
            <div className="text-xs text-gray-500 mt-1">Update and save changes.</div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Name" value={form.name}
                   onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Email" type="email" value={form.email}
                   onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                   placeholder="Phone" value={form.phone}
                   onChange={e => setForm({ ...form, phone: e.target.value })} />
            <textarea rows={3} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                      placeholder="Message" value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="px-5 py-3 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={() => onSave(form)} className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===================== Page =====================
export default function ContactBookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState([]);
  const [cards, setCards] = useState([]); // {id,name,url}
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const masterRef = useRef(null);
  const keyOf = (lead) => `${lead.cardId}|${lead.id}`;
  const isSelected = (key) => selectedKeys.has(key);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) setUser({ ...userDoc.data(), uid: firebaseUser.uid });
      } else setUser(null);
      setLoadingUser(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function fetchLeadsAndCards() {
      if (!user) return;
      setLoadingLeads(true);
      const cardsRef = collection(db, "cards");
      const cardsSnap = await getDocs(query(cardsRef, where("userId", "==", user.uid)));

      const meta = [];
      const allLeads = [];

      for (const cardDoc of cardsSnap.docs) {
        const cardId = cardDoc.id;
        const data = cardDoc.data();
        const cardName = data.name || "Untitled Card";
        const cardUrl = data.uniqueUrl ? data.uniqueUrl : `/c/${cardId}`;
        meta.push({ id: cardId, name: cardName, url: cardUrl });

        const leadsRef = collection(db, "cards", cardId, "leads");
        const leadsSnap = await getDocs(leadsRef);
        leadsSnap.forEach(leadDoc => {
          const ld = leadDoc.data();
          allLeads.push({
            id: leadDoc.id,
            cardId,
            name: ld.name,
            email: ld.email,
            phone: ld.phone,
            message: ld.message,
            cardName,
            cardUrl,
            createdAt: ld.createdAt?.toDate()?.toLocaleString() || "",
          });
        });
      }

      setCards(meta);
      setLeads(allLeads);
      setSelectedKeys(new Set());
      setLoadingLeads(false);
    }
    fetchLeadsAndCards();
  }, [user]);

  const isPremium = user && (user.subscription === "premium" || user.subscription === "admin");

  const displayedLeads = useMemo(() => {
    return leads.filter(lead =>
      !search ||
      (lead.name && lead.name.toLowerCase().includes(search.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.toLowerCase().includes(search.toLowerCase())) ||
      (lead.message && lead.message.toLowerCase().includes(search.toLowerCase())) ||
      (lead.cardName && lead.cardName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [leads, search]);

  useEffect(() => {
    if (!masterRef.current) return;
    const total = displayedLeads.length;
    const selectedOnPage = displayedLeads.filter(l => selectedKeys.has(keyOf(l))).length;
    masterRef.current.indeterminate = selectedOnPage > 0 && selectedOnPage < total;
  }, [displayedLeads, selectedKeys]);

  const handleToggleAllOnPage = (checked) => {
    const next = new Set(selectedKeys);
    if (checked) displayedLeads.forEach(l => next.add(keyOf(l)));
    else displayedLeads.forEach(l => next.delete(keyOf(l)));
    setSelectedKeys(next);
  };
  const handleToggleOne = (lead, checked) => {
    const k = keyOf(lead);
    const next = new Set(selectedKeys);
    if (checked) next.add(k); else next.delete(k);
    setSelectedKeys(next);
  };

  const selectedLeads = useMemo(() => {
    const keys = selectedKeys;
    return leads.filter(l => keys.has(keyOf(l)));
  }, [selectedKeys, leads]);

  const selectedCount = selectedLeads.length;

  const handleUpgradeToast = (popupText = "Upgrade your plan to use this feature!", position = "top-end") => {
    Swal.fire({
      toast: true, title: popupText, icon: "info", position,
      showConfirmButton: false, timer: 2200, timerProgressBar: true,
      background: "#fff", color: "#111",
      didOpen: (toast) => { toast.addEventListener('mouseenter', Swal.stopTimer); toast.addEventListener('mouseleave', Swal.resumeTimer); }
    });
  };

  async function onCreateLead(form) {
    if (!form.cardId) return Swal.fire({ icon: "warning", title: "Please select your card" });
    if (!form.name || !form.email || !form.phone) return Swal.fire({ icon: "warning", title: "Enter name, email and phone" });
    try {
      const ref = await addDoc(collection(db, "cards", form.cardId, "leads"), {
        name: form.name, email: form.email, phone: form.phone, message: form.message || "", createdAt: serverTimestamp()
      });
      const meta = cards.find(c => c.id === form.cardId);
      const newLead = {
        id: ref.id, cardId: form.cardId, name: form.name, email: form.email, phone: form.phone, message: form.message || "",
        cardName: meta?.name || "Untitled Card", cardUrl: meta?.url || `/c/${form.cardId}`, createdAt: new Date().toLocaleString()
      };
      setLeads(prev => [newLead, ...prev]);
      setAddOpen(false);
      Swal.fire({ icon: "success", title: "Contact added" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Add failed", text: e.message || "Please try again" });
    }
  }

  async function onDeleteSelected() {
    if (!selectedCount) return;
    const ok = await Swal.fire({
      icon: "warning", title: `Delete ${selectedCount} contact${selectedCount > 1 ? "s" : ""}?`,
      text: "This action cannot be undone.",
      showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#dc2626"
    });
    if (!ok.isConfirmed) return;
    try {
      const batch = writeBatch(db);
      selectedLeads.forEach(l => batch.delete(doc(db, "cards", l.cardId, "leads", l.id)));
      await batch.commit();
      setLeads(prev => prev.filter(l => !selectedKeys.has(keyOf(l))));
      setSelectedKeys(new Set());
      Swal.fire({ icon: "success", title: "Selected contacts deleted" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Batch delete failed", text: e.message || "Please try again" });
    }
  }

  async function onDeleteLead(lead) {
    const ok = await Swal.fire({
      icon: "warning", title: "Delete contact?", text: "This action cannot be undone.",
      showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#dc2626"
    });
    if (!ok.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "cards", lead.cardId, "leads", lead.id));
      setLeads(prev => prev.filter(l => !(l.id === lead.id && l.cardId === lead.cardId)));
      setSelectedKeys(prev => { const next = new Set(prev); next.delete(keyOf(lead)); return next; });
      Swal.fire({ icon: "success", title: "Contact deleted" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Delete failed", text: e.message || "Please try again" });
    }
  }

  function onStartEdit(lead) { setCurrentLead(lead); setEditOpen(true); }

  async function onSaveEdit(form) {
    if (!currentLead) return;
    try {
      await updateDoc(doc(db, "cards", currentLead.cardId, "leads", currentLead.id), {
        name: form.name || "", email: form.email || "", phone: form.phone || "", message: form.message || "", updatedAt: serverTimestamp()
      });
      setLeads(prev => prev.map(l => (l.id === currentLead.id && l.cardId === currentLead.cardId ? { ...l, ...form } : l)));
      setEditOpen(false);
      Swal.fire({ icon: "success", title: "Contact updated" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e.message || "Please try again" });
    }
  }

  if (loadingUser) return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>;
  if (!user) return <div className="flex items-center justify-center h-screen text-lg">Please log in to view your leads.</div>;

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
      {/* Scoped custom scrollbar styles (advanced) */}
      <style>{`
        .nice-scrollbar {
          scrollbar-width: thin;             /* Firefox */ 
          scrollbar-color: #9aa5b1 #eef2ff;  /* thumb track */ 
        }
        .nice-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; } /* Chrome/Safari */ 
        .nice-scrollbar::-webkit-scrollbar-track { background: #eef2ff; border-radius: 8px; }
        .nice-scrollbar::-webkit-scrollbar-thumb { background: #9aa5b1; border-radius: 8px; }
        .nice-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Header */}
        <header className="flex items-center bg-white border-b p-4 md:hidden shadow-sm">
          <button aria-label="Toggle menu" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-blue-100 transition">
            <svg width={22} height={22} fill="currentColor">
              <rect width="100%" height="4" y="2" rx="2" />
              <rect width="100%" height="4" y="9" rx="2" />
              <rect width="100%" height="4" y="16" rx="2" />
            </svg>
          </button>
          <div className="flex-1 text-center font-semibold text-black">{user?.name ?? user?.displayName}</div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none ml-4">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white border-b p-4 shadow-sm">
          <div className="font-semibold text-lg text-gray-800">{user?.name ?? user?.displayName}</div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 bg-gradient-to-tl from-blue-100/40 to-white">
          {/* Title + Controls */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center md:space-x-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-gray-900">Captured Leads</h1>
              <div className="text-gray-500 text-sm max-w-md">
                Manage leads from digital cards, export selected or all, and perform bulk actions when needed.
              </div>
            </div>

            <div className="flex w-full md:w-auto items-stretch gap-2 mt-4 md:mt-0 flex-row flex-wrap justify-start">
              <ExportControl leads={leads} selectedLeads={selectedLeads} disabled={!isPremium} />
              <button
                type="button"
                onClick={() => (isPremium ? setAddOpen(true) : handleUpgradeToast())}
                className="flex items-center gap-2 px-4 py-2 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm"
              >
                <FaPlus /> Add Contact
              </button>
              <button
                type="button"
                disabled={!selectedLeads.length}
                onClick={() => (isPremium ? onDeleteSelected() : handleUpgradeToast())}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm border ${selectedLeads.length ? "border-red-300 text-red-700 hover:bg-red-50" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                title="Delete Selected"
              >
                <FaTrash /> Delete Selected{selectedLeads.length ? ` (${selectedLeads.length})` : ""}
              </button>
              <input
                type="text"
                className="flex-1 min-w-[160px] sm:min-w-[220px] max-w-xs px-4 py-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm"
                placeholder="Search by name, email, phone, card, or message…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => { if (!isPremium) handleUpgradeToast("Upgrade to search leads!", "top-end"); }}
                readOnly={!isPremium}
              />
            </div>
          </div>

          {/* Leads Table: vertical + horizontal advanced scrollbar; actions after Received */}
          <div className="relative w-full">
            <div className={`rounded-xl shadow bg-white p-2 sm:p-4 ${!isPremium ? "blur-sm select-none pointer-events-none" : ""}`}>
              {/* Scroll region with custom scrollbar and max height */}
              <div className="nice-scrollbar overflow-x-auto overflow-y-auto max-h-[70vh]">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-gray-500 border-b pb-2 mb-2 min-w-max">
                    <span className="pl-2">
                      <input
                        ref={masterRef}
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-600"
                        checked={displayedLeads.length > 0 && displayedLeads.every(l => selectedKeys.has(`${l.cardId}|${l.id}`))}
                        onChange={(e) => handleToggleAllOnPage(e.target.checked)}
                        title="Select all on page"
                      />
                    </span>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Message</span>
                    <span>Card</span>
                    <span>Received</span>
                    <span className="text-right pr-2">Actions</span>
                  </div>

                  {/* Loading skeleton when leads not yet loaded */}
                  {loadingLeads && (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-8 gap-2 items-center py-2 min-w-max animate-pulse">
                          <div className="pl-2"><div className="h-4 w-4 bg-gray-200 rounded" /></div>
                          <div className="h-3 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-200 rounded w-28" />
                          <div className="h-3 bg-gray-200 rounded w-20" />
                          <div className="h-3 bg-gray-200 rounded w-40" />
                          <div className="h-3 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-200 rounded w-28" />
                          <div className="flex justify-end pr-2 gap-2">
                            <div className="h-7 w-7 bg-gray-200 rounded" />
                            <div className="h-7 w-7 bg-gray-200 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state or rows */}
                  {!loadingLeads && (displayedLeads.length === 0 ? (
                    <div className="w-full flex flex-col items-center py-20">
                      <svg width={64} height={64} className="mb-4 text-indigo-300" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
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
                    displayedLeads.map(lead => {
                      const k = `${lead.cardId}|${lead.id}`;
                      return (
                        <div key={k} className="grid grid-cols-8 gap-2 text-xs items-center py-2 border-b last:border-b-0 min-w-max">
                          <div className="pl-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-indigo-600"
                              checked={isSelected(k)}
                              onChange={(e) => handleToggleOne(lead, e.target.checked)}
                              title="Select"
                            />
                          </div>
                          <div className="min-w-0 truncate" title={lead.name}>{lead.name}</div>
                          <div className="min-w-0 truncate" title={lead.email}>{lead.email}</div>
                          <div className="min-w-0 truncate" title={lead.phone}>{lead.phone}</div>
                          <div className="min-w-0 truncate max-w-[160px] md:max-w-[260px]" title={lead.message}>{lead.message}</div>
                          <div className="min-w-0 truncate text-indigo-700" title={lead.cardName}>
                            <a href={lead.cardUrl} target="_blank" rel="noreferrer" className="hover:underline">{lead.cardName}</a>
                          </div>
                          <div className="min-w-0 truncate text-gray-500" title={lead.createdAt}>{lead.createdAt}</div>
                          <div className="flex items-center justify-end gap-2 pr-2">
                            <button className="p-2 rounded border text-indigo-700 border-indigo-200 hover:bg-indigo-50" title="Edit" onClick={() => onStartEdit(lead)}>
                              <FaEdit />
                            </button>
                            <button className="p-2 rounded border text-red-700 border-red-200 hover:bg-red-50" title="Delete" onClick={() => onDeleteLead(lead)}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
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

      {/* Modals */}
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} cards={cards} onCreate={onCreateLead} />
      <EditLeadModal open={editOpen} onClose={() => setEditOpen(false)} lead={currentLead} onSave={onSaveEdit} />
    </div>
  );
}
