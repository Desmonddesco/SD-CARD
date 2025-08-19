import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaTags, FaPlus, FaMapMarkerAlt, FaQrcode, FaExternalLinkAlt } from "react-icons/fa";

export default function ContactBookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Demo: contacts empty 
  const contacts = [];

  // Fake user for sidebar, replace with real state if needed
  const user = { displayName: "Demo User", email: "demo@yourdomain.com", name: "Demo User" };
  const loadingUser = false;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile */}
        <header className="flex items-center justify-between bg-white border-b p-4 md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 transition"
          >
            <svg width={22} height={22} fill="currentColor">
              <rect width="100%" height="4" y="2" rx="2"/>
              <rect width="100%" height="4" y="9" rx="2"/>
              <rect width="100%" height="4" y="16" rx="2"/>
            </svg>
          </button>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-black text-base">{user?.name ?? user?.displayName}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">

          {/* PAGE HEADER & SUBHEADING */}
          <div className="flex flex-col md:flex-row md:justify-between mb-5 items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Contact Book</h1>
              <div className="text-gray-400 text-sm">
                All the contacts you collect in person, online, or virtually will appear here.
                You can follow up, export, or organize them with tags.
              </div>
            </div>
          </div>

          {/* Top Bar - Banner */}
          <div className="w-full bg-blue-50 text-sm px-4 py-2 mb-2 flex items-center justify-between font-semibold border-b">
            <span className="flex items-center gap-2 text-blue-900">
              <span className="text-orange-600">⚡</span>
              Never Lose a Lead Again – Join Thousands Upgrading to SB CARD Plus!
            </span>
            <a href="/free-trial" className="text-blue-800 underline hover:text-blue-600 transition">Start Free Trial</a>
          </div>

          {/* Actions: Search, Filters, Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition text-sm"
              placeholder="Find any contact by name, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              className="flex gap-2 items-center px-4 py-2 border border-gray-300 rounded shadow-sm bg-white hover:bg-gray-100 text-gray-600 font-semibold"
              onClick={() => alert('Filters')}
            >
              Filters <span><FaTags /></span>
            </button>
            <button
              className="flex gap-2 items-center px-5 py-2 rounded shadow font-semibold bg-black text-white hover:bg-gray-800 transition"
            >
              <FaPlus /> Add New Contact
            </button>
            <button
              className="flex gap-2 items-center px-4 py-2 border border-gray-200 rounded shadow-sm bg-white hover:bg-blue-50 text-gray-700 font-semibold"
            >
              <FaMapMarkerAlt /> Map
            </button>
            <button
              className="flex gap-2 items-center px-4 py-2 border border-gray-200 rounded shadow-sm bg-white hover:bg-blue-50 text-gray-700 font-semibold"
            >
              <FaQrcode /> Scan
            </button>
            <button
              className="flex gap-2 items-center px-4 py-2 border border-gray-200 rounded shadow-sm bg-white hover:bg-blue-50 text-gray-700 font-semibold"
            >
              Export <FaExternalLinkAlt />
            </button>
          </div>

          {/* Manage Tags Button */}
          <button
            className="flex items-center gap-2 mb-2 px-4 py-2 border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-100 font-semibold text-gray-700"
            style={{ maxWidth: 160 }}
          >
            <FaTags /> Manage Tags
          </button>

          {/* Table Head */}
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-500 border-b pb-2 mb-2">
            <span>Contact</span>
            <span>Tags</span>
            <span>Connected With</span>
            <span>Card</span>
            <span>Date</span>
          </div>

          {/* Contact Rows or Empty State */}
          {contacts.length === 0 ? (
            <div className="w-full flex flex-col items-center py-20">
              {/* Placeholder SVG */}
              <svg width={64} height={64} className="mb-4 text-indigo-300" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="20" width="48" height="36" rx="4" fill="#E0E7FF"/>
                <rect x="22" y="34" width="20" height="4" rx="2" fill="#A5B4FC"/>
                <rect x="22" y="42" width="16" height="2" rx="1" fill="#A5B4FC"/>
                <rect x="18" y="28" width="28" height="2" rx="1" fill="#A5B4FC"/>
              </svg>
              <div className="text-lg font-semibold text-gray-700 mb-2">Start Building Your Network</div>
              <div className="text-gray-500 mb-4 text-center max-w-xs">
                Add contacts by scanning cards, uploading files, or using forms.
              </div>
            </div>
          ) : (
            contacts.map(contact => (
              <div className="grid grid-cols-5 gap-2 text-xs items-center py-2 border-b last:border-b-0" key={contact.id}>
                {/* Render contact info here */}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
