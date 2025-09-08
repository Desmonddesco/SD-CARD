import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { FaSyncAlt } from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { auth, db } from "../firebase";
import {
  doc, getDoc, collection, getDocs, query, where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const demoPie = [
  { name: "Digital Card", value: 8 },
  { name: "Other", value: 0 }
];
const PIE_COLORS = ["#00C2A8", "#E5E7EB"]; // professional teal + neutral

const lineColors = {
  Views: "#00C2A8",           // teal
  "Card Created": "#2563EB",  // professional blue
  "Leads Generated": "#EF4444"// professional red
};

const METRIC_KEYS = [
  { key: "Views", label: "Views" },
  { key: "CardCreated", label: "Card Created" },
  { key: "LeadsGenerated", label: "Leads Generated" }
];

const MetricCard = ({ label, value, change, highlight }) => (
  <div className={`rounded-xl p-5 bg-white shadow min-w-[160px] flex flex-col gap-2 border ${highlight ? "border-teal-300" : "border-gray-200"}`}>
    <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
    <span className={`text-xs font-semibold ${change && change > 0 ? "text-green-600" : "text-gray-400"}`}>{change ? `↗ ${change}%` : ""}</span>
  </div>
);

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Metrics
  const [realViews, setRealViews] = useState(0);
  const [realCardCount, setRealCardCount] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [realLeads, setRealLeads] = useState(0);
  const [contactsDownloaded, setContactsDownloaded] = useState(0);

  // Tables and charts
  const [topLinks, setTopLinks] = useState([]);
  const [topSources, setTopSources] = useState([]);
  const [aggLineData, setAggLineData] = useState([]);
  const [markerLocations, setMarkerLocations] = useState([]);

  // UI state
  const [activeLines, setActiveLines] = useState(METRIC_KEYS.map(m => m.key));
  const [range, setRange] = useState("7"); // "7" or "30"

  // Auth listener
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

  // Fetch analytics
  useEffect(() => {
    if (!user) return;

    async function fetchCardAnalytics() {
      const cardsRef = collection(db, "cards");
      const createdSnap = await getDocs(query(cardsRef, where("userId", "==", user.uid)));

      // Aggregates
      let totalViews = 0;
      let uniqueVisitorsSet = new Set();
      let totalLeads = 0;
      let totalContactsDownloadedField = 0;

      let linksForTable = [];
      let aggregateSources = {};

      // Daily aggregations
      let metricsByDay = {}; // { "DD/MM": { Views, CardCreated, LeadsGenerated } }
      let cardCreatedDates = new Set();

      // Locations aggregation (city,country -> count)
      let locs = [];

      // Date window start
      const today = new Date();
      const start = new Date(today);
      start.setHours(0,0,0,0);
      const windowDays = range === "30" ? 30 : 7;
      start.setDate(start.getDate() - (windowDays - 1));

      const inRangeKey = (dt) => {
        const d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        return d >= start;
      };

      for (const docSnap of createdSnap.docs) {
        const data = docSnap.data();

        totalViews += typeof data.views === "number" ? data.views : 0;
        if (Array.isArray(data.visitors)) {
          data.visitors.forEach(v => uniqueVisitorsSet.add(v));
        }
        totalContactsDownloadedField += typeof data.contactsDownloaded === "number" ? data.contactsDownloaded : 0;

        linksForTable.push({
          cardName: data.name || "Untitled Card",
          views: typeof data.views === "number" ? data.views : 0,
          url: data.uniqueUrl || "#"
        });

        if (data.trafficSources && typeof data.trafficSources === "object") {
          for (const [src, count] of Object.entries(data.trafficSources)) {
            aggregateSources[src] = (aggregateSources[src] || 0) + (typeof count === "number" ? count : 0);
          }
        }

        if (data.createdAt && data.createdAt.toDate) {
          const d = data.createdAt.toDate();
          if (inRangeKey(d)) {
            const key = `${d.getDate()}/${d.getMonth() + 1}`;
            cardCreatedDates.add(key);
          }
        }

        // Leads per day
        const leadsRef = collection(db, "cards", docSnap.id, "leads");
        const leadsSnap = await getDocs(leadsRef);
        totalLeads += leadsSnap.size;
        leadsSnap.forEach(leadDoc => {
          const ld = leadDoc.data();
          if (ld.createdAt && ld.createdAt.toDate) {
            const d = ld.createdAt.toDate();
            if (!inRangeKey(d)) return;
            const key = `${d.getDate()}/${d.getMonth() + 1}`;
            if (!metricsByDay[key]) metricsByDay[key] = {};
            metricsByDay[key].LeadsGenerated = (metricsByDay[key].LeadsGenerated || 0) + 1;
          }
        });

        // Views + locations (within window)
        const viewsRef = collection(db, "cards", docSnap.id, "views");
        const viewsSnap = await getDocs(viewsRef);
        viewsSnap.forEach(docView => {
          const vd = docView.data();
          if (vd.createdAt && vd.createdAt.toDate) {
            const d = vd.createdAt.toDate();
            if (!inRangeKey(d)) return;
            const key = `${d.getDate()}/${d.getMonth() + 1}`;
            if (!metricsByDay[key]) metricsByDay[key] = {};
            metricsByDay[key].Views = (metricsByDay[key].Views || 0) + 1;

            if (vd.location && typeof vd.location.lat === "number" && typeof vd.location.lng === "number") {
              locs.push({
                city: vd.location.city,
                region: vd.location.region,
                country: vd.location.country,
                lat: vd.location.lat,
                lng: vd.location.lng,
                org: vd.location.org
              });
            }
          }
        });
      }

      cardCreatedDates.forEach(key => {
        if (!metricsByDay[key]) metricsByDay[key] = {};
        metricsByDay[key].CardCreated = (metricsByDay[key].CardCreated || 0) + 1;
      });

      // Build continuous date keys across the window
      const keys = [];
      for (let i = 0; i < windowDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        keys.push(`${d.getDate()}/${d.getMonth() + 1}`);
      }

      const chartDataArr = keys.map(k => ({
        date: k,
        Views: metricsByDay[k]?.Views || 0,
        CardCreated: metricsByDay[k]?.CardCreated || 0,
        LeadsGenerated: metricsByDay[k]?.LeadsGenerated || 0
      }));

      setRealViews(chartDataArr.reduce((acc, curr) => acc + (curr.Views || 0), 0));
      setRealCardCount(createdSnap.size);
      setUniqueVisitors(uniqueVisitorsSet.size);
      setContactsDownloaded(totalContactsDownloadedField);
      setRealLeads(chartDataArr.reduce((acc, curr) => acc + (curr.LeadsGenerated || 0), 0));

      setTopLinks(linksForTable.sort((a, b) => b.views - a.views));

      const sortedSources = Object.entries(aggregateSources)
        .sort((a, b) => b[1] - a[1])
        .map(([source, count]) => ({ source, count }));
      setTopSources(sortedSources);

      setAggLineData(chartDataArr);
      setMarkerLocations(locs);
    }

    fetchCardAnalytics();
  }, [user, range]);

  // Locations summary aggregation
  const cityAgg = useMemo(() => {
    const agg = {};
    markerLocations.forEach(loc => {
      const key = [loc.city, loc.country].filter(Boolean).join(", ");
      agg[key] = (agg[key] || 0) + 1;
    });
    return agg;
  }, [markerLocations]);

  const isPremium = user && (user.subscription === "premium" || user.subscription === "admin");

  const metrics = [
    { label: "Views", value: realViews, change: "", highlight: true },
    { label: "Card Created", value: realCardCount },
    { label: "Leads Generated", value: realLeads },
    { label: "Contacts Downloaded", value: contactsDownloaded }
  ];

  const handleUpgradeToast = (popupText = "Upgrade your plan to see analytics!", position = "top-end") => {
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

  function handleShowOnlyMetric(metricKey) {
    setActiveLines([metricKey]);
  }
  function handleShowAllMetrics() {
    setActiveLines(METRIC_KEYS.map(m => m.key));
  }

  if (loadingUser) return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>;
  if (!user) return <div className="flex items-center justify-center h-screen text-lg">Please log in to view analytics.</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-white border-b p-4 md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 transition"
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
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="flex flex-col md:flex-row md:justify-between mb-7 items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Analytics</h1>
              <div className="text-gray-400 text-sm">Track link views, leads, and performance over the selected period.</div>
            </div>
            <div className="flex gap-3 mt-2 md:mt-0">
              <button
                className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded hover:bg-red-200 shadow transition flex items-center"
                onClick={() => isPremium ? alert("Analytics reset!") : handleUpgradeToast("Upgrade to reset analytics!")}
              >
                <FaSyncAlt className="mr-2" />Reset
              </button>
              <select
                className="px-4 py-2 bg-white border border-gray-200 rounded shadow text-sm"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <div className={isPremium ? "" : "blur-sm pointer-events-none select-none"}>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {metrics.map((m, i) => (
                  <MetricCard key={i} {...m} />
                ))}
              </div>

              {/* Performance Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white col-span-3 p-5 rounded-xl shadow flex flex-col min-h-[268px]">
                  <div className="text-xl font-bold mb-3">Link Performance</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={aggLineData}>
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      {METRIC_KEYS.map(metric =>
                        activeLines.includes(metric.key) && (
                          <Line
                            key={metric.key}
                            type="monotone"
                            dataKey={metric.key}
                            stroke={lineColors[metric.label]}
                            dot
                            name={metric.label}
                            strokeWidth={3}
                          />
                        )
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    {METRIC_KEYS.map(metric => (
                      <button
                        key={metric.key}
                        className="px-3 py-1 rounded text-xs font-semibold border"
                        style={{
                          borderColor: lineColors[metric.label],
                          background: lineColors[metric.label],
                          color: "#fff",
                          opacity: activeLines.includes(metric.key) ? 1 : 0.45
                        }}
                        onClick={() => handleShowOnlyMetric(metric.key)}
                        title={`Show only ${metric.label}`}
                      >
                        {metric.label}
                      </button>
                    ))}
                    <button
                      onClick={handleShowAllMetrics}
                      className="px-3 py-1 rounded text-xs font-semibold border bg-gray-200 text-gray-700"
                      title="Show all"
                    >
                      Show All
                    </button>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col gap-4">
                  {/* Donut Chart */}
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
                  {/* Top Digital Card Sources */}
                  <div className="bg-white p-4 rounded-xl shadow flex flex-col">
                    <div className="font-semibold text-base mb-2">Top Digital Card Sources</div>
                    <div className="flex flex-col text-xs text-gray-700">
                      {topSources.length === 0 ? (
                        <span className="text-gray-400">No source data yet.</span>
                      ) : (
                        topSources.map(({ source, count }) => (
                          <div key={source}>
                            {source.charAt(0).toUpperCase() + source.slice(1)} - {count} View{count !== 1 ? 's' : ''}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Placeholder */}
                  <div className="bg-white p-4 rounded-xl shadow flex flex-col">
                    <div className="font-semibold text-base mb-2">Top Traffic Sources</div>
                    <div className="text-xs text-gray-400">No Data Available</div>
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
                {topLinks.length === 0 ? (
                  <div className="text-xs text-gray-400 py-4">No data yet.</div>
                ) : (
                  topLinks.map((link, idx) => (
                    <div key={link.url + idx} className="grid grid-cols-2 gap-2 text-xs items-center border-b last:border-b-0 py-1">
                      <span className="truncate">
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-indigo-700 font-medium hover:underline">
                          {link.cardName}
                        </a>
                        <br /><span className="text-gray-400">▸ Digital Card</span>
                      </span>
                      <span>{link.views}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Locations Summary Table */}
              <div className="bg-white p-5 rounded-xl shadow mb-8 flex flex-col">
                <div className="font-semibold text-base mb-2">Visitor Locations</div>
                {Object.keys(cityAgg).length === 0 ? (
                  <div className="text-xs text-gray-400 py-4 text-center">No location data yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border mt-2 rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-1 font-semibold text-left rounded-tl">City/Country</th>
                          <th className="p-1 font-semibold text-right rounded-tr">Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(cityAgg).sort((a, b) => b[1] - a[1]).map(([place, count]) => (
                          <tr key={place} className="border-t last:border-b-0">
                            <td className="p-1">{place}</td>
                            <td className="p-1 text-right">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl shadow flex items-center justify-between">
                <span className="font-semibold text-base">NFC Product Performance</span>
                <span className="text-xs text-gray-400">No Data Available</span>
                <button className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold"
                  onClick={() => isPremium ? alert("Add NFC Product") : handleUpgradeToast("Upgrade to add NFC products!")}>
                  + Add NFC Product
                </button>
              </div>
            </div>
            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-white/60 backdrop-blur-sm rounded w-full h-full" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-black text-sm font-medium bg-white/90 rounded px-4 py-2 shadow pointer-events-auto">
                    Upgrade to Premium to access analytics!
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
