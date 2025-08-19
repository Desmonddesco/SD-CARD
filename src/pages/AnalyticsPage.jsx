import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { FaSyncAlt } from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const MetricCard = ({ label, value, change, highlight }) => (
  <div className={`rounded-xl p-5 bg-white shadow min-w-[160px] flex flex-col gap-2 border ${highlight ? "border-green-300" : "border-gray-200"}`}>
    <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
    <span className={`text-xs font-semibold ${change && change > 0 ? "text-green-600" : "text-gray-400"}`}>{change ? `↗ ${change}%` : ""}</span>
  </div>
);

const demoLine = [
  { date: '11/8', Clicks: 0, Views: 0, Leads: 0 },
  { date: '12/8', Clicks: 1, Views: 1, Leads: 0 },
  { date: '13/8', Clicks: 2, Views: 3, Leads: 0 },
  { date: '14/8', Clicks: 2, Views: 4, Leads: 0 },
  { date: '15/8', Clicks: 3, Views: 5, Leads: 0 },
  { date: '16/8', Clicks: 2, Views: 7, Leads: 0 },
  { date: '17/8', Clicks: 2, Views: 8, Leads: 0 },
];

const demoPie = [
  { name: "Digital Card", value: 8 },
  { name: "Other", value: 0 }
];
const PIE_COLORS = ["#23FA9E", "#E5E7EB"];

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Replace with your real user logic
  const user = { displayName: "Demo User", email: "demo@yourdomain.com", name: "Demo User" };
  const loadingUser = false;

  const metrics = [
    { label: "Leads Generated", value: 0 },
    { label: "Views", value: 0, change: 0.1, highlight: true },
    { label: "Contacts Downloaded", value: 0 },
    { label: "Card Created", value: 0 },
  ];

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

        {/* Analytics Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:justify-between mb-7 items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Analytics</h1>
              <div className="text-gray-400 text-sm">Track link views, leads, and performance to see what's working and where to improve.</div>
            </div>
            <div className="flex gap-3 mt-2 md:mt-0">
              <button className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded hover:bg-red-200 shadow transition flex items-center"><FaSyncAlt className="mr-2" />Reset</button>
              <select className="px-4 py-2 bg-white border border-gray-200 rounded shadow text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {metrics.map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>

          {/* Performance Chart and Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Line Chart Panel */}
            <div className="bg-white col-span-3 p-5 rounded-xl shadow flex flex-col min-h-[268px]">
              <div className="text-xl font-bold mb-3">Link Performance</div>
              <div className="flex-1 flex justify-center items-center w-full">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={demoLine}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Views" stroke="#23FA9E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold">Clicks</button>
                <button className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold">Views</button>
                <button className="px-3 py-1 bg-gray-100 rounded text-xs font-semibold">Leads</button>
              </div>
            </div>
            {/* Side Panels */}
            <div className="col-span-2 flex flex-col gap-4">
              {/* Donut chart */}
              <div className="bg-white p-4 rounded-xl shadow flex items-center">
                <PieChart width={75} height={75}>
                  <Pie
                    data={demoPie}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={37}
                    fill="#8884d8"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {demoPie.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="ml-2">
                  <div className="font-semibold text-base">View Types</div>
                  <div className="text-xs text-gray-400">Based on all views</div>
                </div>
              </div>
              {/* Top Traffic Sources */}
              <div className="bg-white p-4 rounded-xl shadow flex flex-col">
                <div className="font-semibold text-base mb-2">Top Traffic Sources</div>
                <div className="text-xs text-gray-400">No Data Available</div>
              </div>
              {/* Top Digital Card */}
              <div className="bg-white p-4 rounded-xl shadow flex flex-col">
                <div className="font-semibold text-base mb-2">Top Digital Card</div>
                <div className="flex flex-col text-xs text-gray-700">
                  <div>LinkedIn - 1 View</div>
                  <div>Email - 1 View</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Links Table */}
          <div className="bg-white p-5 rounded-xl shadow mb-8">
            <div className="font-semibold text-base mb-2">Top Links</div>
            <div className="grid grid-cols-2 gap-2 mb-1 text-xs text-gray-500 font-bold border-b pb-1">
              <span>Link</span>
              <span>Views</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs items-center">
              <span className="truncate">Muslim Desmond<br /><span className="text-gray-400">▸ Digital Card</span></span>
              <span>8</span>
            </div>
          </div>

          {/* Locations (as placeholder) */}
          <div className="bg-white p-5 rounded-xl shadow mb-8 flex flex-col">
            <div className="font-semibold text-base mb-2">Locations</div>
            <div className="flex-1 flex items-center justify-center min-h-[100px] text-gray-300">
              [Map Chart Here]
            </div>
          </div>

          {/* NFC Product Performance */}
          <div className="bg-white p-5 rounded-xl shadow flex items-center justify-between">
            <span className="font-semibold text-base">NFC Product Performance</span>
            <span className="text-xs text-gray-400">No Data Available</span>
            <button className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">+ Add NFC Product</button>
          </div>
        </main>
      </div>
    </div>
  );
}
