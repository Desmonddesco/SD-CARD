import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import LeftNav from "../components/LeftNav";

const TIERS = [
  {
    name: "Plus",
    price: 45,
    per: "user / month",
    features: [
      "Digital cards (personal & company branding)",
      "Contact book",
      "Analytics dashboard",
      "Profile management",
      "Standard support",
    ],
    disabled: [
      "CRM integration",
      "Business card scanner",
      "Digital wallet",
      "Email signature",
    ],
    cta: "Get Plus",
    highlight: false,
  },
  {
    name: "Premier",
    price: 120,
    per: "user / month",
    features: [
      "All Plus features",
      "CRM integration",
      "Business card scanner",
      "Digital wallet",
      "Email signature",
      "Priority support",
    ],
    cta: "Get Premier",
    highlight: true,
  },
  {
    name: "Unlimited",
    price: 2990,
    per: "unlimited users / month",
    features: [
      "All Premier features",
      "Unlimited users (one company)",
      "Premium onboarding",
      "Account manager",
    ],
    cta: "Get Unlimited",
    highlight: false,
  },
];

export default function SubscriptionPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().name) {
          setUserName(snap.data().name);
        } else {
          setUserName(user.displayName || user.email || "");
        }
        setCheckingAuth(false);
      }
    });
    return () => typeof unsub === "function" && unsub();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <span className="text-xl text-gray-500 animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle Button */}
      <button
        aria-label="Toggle sidebar"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-300 shadow"
      >
        {sidebarOpen ? (
          // X/close SVG
          <svg
            className="h-6 w-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Hamburger SVG
          <svg
            className="h-6 w-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Sidebar (mobile overlay and normal left sidebar) */}
      <LeftNav
        activeKey="subscription"
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col pt-8 pb-8 md:ml-64">
        <div className="w-full px-4 md:px-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Choose Your Plan
          </h1>
          {/* Responsive layout: vertical stack on mobile, grid on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center items-stretch mb-10">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col relative rounded-2xl bg-white shadow-xl hover:shadow-2xl transition border border-gray-100 ${
                  tier.highlight ? "ring-4 ring-blue-200" : ""
                }`}
                style={{ minHeight: 420 }}
              >
                <div className="p-7 flex flex-col items-center text-center flex-1">
                  <span className="uppercase font-bold tracking-widest text-gray-500 mb-2 text-base">
                    {tier.name}
                  </span>
                  <div className="mb-2 flex items-baseline justify-center">
                    <span className="text-4xl font-extrabold text-blue-900 mr-1">
                      R{tier.price}
                    </span>
                    <span className="text-sm text-gray-600 font-semibold">
                      {tier.per}
                    </span>
                  </div>
                  <ul className="my-5 text-sm space-y-2">
                    {tier.features.map((f, i) => (
                      <li key={i} className="text-gray-800 flex items-center gap-2">
                        <span className="text-green-600 font-bold">✓</span> {f}
                      </li>
                    ))}
                    {Array.isArray(tier.disabled)
                      ? tier.disabled.map((x, i) => (
                          <li
                            key={x}
                            className="text-gray-400 flex items-center gap-2 line-through"
                          >
                            <span className="text-red-400 font-bold">✗</span> {x}
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
                <div className="flex-shrink-0 flex flex-col justify-end items-center w-full px-7 pb-7 absolute left-0 bottom-0">
                  <button
                    className={`w-full px-7 py-2 rounded-lg font-semibold ${
                      tier.highlight
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "bg-gray-900 text-white hover:bg-blue-700"
                    } transition`}
                  >
                    {tier.cta}
                  </button>
                </div>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 px-6 py-1 rounded-full text-white font-semibold shadow text-xs border-2 border-white">
                    Popular
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-10 text-xs">
            All prices exclude VAT. Unlimited includes all features, unlimited users, world-class support & onboarding. Contact us for enterprise options.
          </p>
        </div>
      </main>
    </div>
  );
}
