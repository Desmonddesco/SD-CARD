import React, { useState, useEffect } from "react";
import { FaBars,FaShareAlt, FaTrash, FaEye, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, doc, deleteDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";
import DigitalCardPreview from "../components/DigitalCardPreview";
import { motion } from "framer-motion";
import CardThumbnail from "../components/CardThumbnail"; // import above
import { div } from "framer-motion/client";





const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};

function getFirstWord(str) {
  if (typeof str !== "string" || str.length === 0) return "";
  return str.split(" ")[0] || "";
}

function CardDisplay({ card, onEdit, onDelete, setCardToPreview, navigate }) {
  const handleDeleteClick = e => {
    e.stopPropagation();
    Swal.fire({
      title: "Delete this card?",
      text: "This card will be deleted permanently and cannot be recovered.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "No, keep it"
    }).then(result => {
      if (result.isConfirmed) onDelete(card.id);
    });
  };

  return (
  <div
  className="w-full sm:max-w-xs min-h-[180px] sm:min-h-[220px] rounded-2xl shadow-lg p-4 sm:p-7 flex flex-col items-center bg-white border transition cursor-pointer hover:border-blue-500"
  style={{ boxShadow: `0 6px 32px 0 rgba(60,60,90,0.10), 0 0 0 1.5px ${card.cardColor}44` }}

>
  {/* Live badge at the very top */}
  <div className="flex w-full justify-between items-center mb-2">
    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-400 text-black font-bold text-sm shadow" style={{ fontFamily: 'inherit' }}>
      <svg className="mr-1" width="19" height="19" viewBox="0 0 24 24" fill="none">
        <g>
          <circle cx="12" cy="12" r="12" fill="none"/>
          <path d="M8 13c.5-1 .5-3 0-4" stroke="black" strokeWidth="2" fill="none"/>
          <path d="M16 13c-.5-1-.5-3 0-4" stroke="black" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="1.4" fill="black"/>
        </g>
      </svg>
      Live
    </span>
  </div>
  {/* ...CardThumbnail and other content below... */}
  <div className="flex w-full justify-center items-center mb-2">
    <CardThumbnail card={card} />
  </div>
  {/* ...rest of your card content... */}

      {/* Card Name */}
      <div className="w-full text-center mb-2">
       <div className="text-xs text-gray-400 font-medium w-full max-w-full overflow-hidden">
  Card Name: <span className="font-semibold truncate break-words w-full max-w-full">{card.cardName || "-"}</span>
</div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full items-center justify-center gap-4 mt-auto">
        <motion.button
          onClick={e => { e.stopPropagation(); setCardToPreview(card); }}
          tabIndex={0}
          aria-label="View"
          type="button"
          className="w-12 h-12 flex justify-center items-center rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg hover:bg-blue-50 transition"
        >
          <FaEye className="text-blue-700 text-xl" />
        </motion.button>
        <motion.button
          onClick={e => { e.stopPropagation(); navigate(`/digitalcardeditor/${card.id}`); }}
          tabIndex={0}
          aria-label="Edit"
          type="button"
          className="w-12 h-12 flex justify-center items-center rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg hover:bg-green-50 transition"
        >
          <FaEdit className="text-green-600 text-xl" />
        </motion.button>
        <motion.button
          onClick={e => {
            e.stopPropagation();
            if (card.shareLink) {
              Swal.fire({
                title: "Share Your Card",
                html: `
                  <div style='display:flex;flex-direction:column;align-items:center;width:100%;'>
                    <input
                      style="width:90%; padding:9px; border-radius:8px; border:1px solid #ccc; font-size:15px; margin-bottom:8px; text-align:center"
                      value='${card.shareLink}'
                      readonly
                    />
                    <button id='copy-link-btn' style='padding:7px 20px; border-radius:7px; border:none; background:#2563eb;color:white;font-weight:bold;cursor:pointer;margin-top:8px;'>Copy Link</button>
                  </div>
                `,
                didOpen: () => {
                  setTimeout(() => {
                    const btn = document.getElementById("copy-link-btn");
                    if (btn) {
                      btn.onclick = function () {
                        navigator.clipboard.writeText(card.shareLink);
                        btn.textContent = "Copied!";
                        setTimeout(() => { btn.textContent = "Copy Link"; }, 1400);
                      };
                    }
                  }, 250);
                },
                width: 370,
                confirmButtonText: "Close"
              });
            } else {
              Swal.fire({
                title: "",
                html: `
                  <div style='display:flex;flex-direction:column;align-items:center;width:100%;'>
                    <p class='mb-2'>This card does not have a share link.</p>
                    <button id='generate-link-btn' style='padding:10px 20px; border-radius:7px; border:none; background:#2563eb;color:white;font-weight:bold;cursor:pointer;font-size:15px;'>Generate Link and QR Code</button>
                  </div>
                `,
                didOpen: () => {
                  document.getElementById("generate-link-btn").onclick = function () {
                    Swal.fire({
                      icon: "info",
                      title: "Subscription Required",
                      text: "Subscribe to unlock the Generate Link and QR Code feature.",
                      confirmButtonText: "Subscribe",
                      cancelButtonText: "Not now",
                      showCancelButton: true
                    });
                  };
                },
                width: 350,
                confirmButtonText: "Close"
              });
            }
          }}
          tabIndex={0}
          aria-label="Share"
          type="button"
          className="w-12 h-12 flex justify-center items-center rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg hover:bg-purple-50 transition"
        >
          <FaShareAlt className="text-purple-600 text-xl" />
        </motion.button>
        <motion.button
          onClick={handleDeleteClick}
          tabIndex={0}
          aria-label="Delete"
          type="button"
          className="w-12 h-12 flex justify-center items-center rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg hover:bg-red-50 transition"
        >
          <FaTrash className="text-red-500 text-xl" />
        </motion.button>
      </div>
    </div>
  );
}
const networkingTools = [
  { id: 1, title: "Email Signature", description: "Share your info in every email you send." },
  { id: 2, title: "Auto Follow-Up", description: "Automate follow-ups and never miss a connection." },
  { id: 3, title: "Virtual Background", description: "Create a virtual background for video calls." },
  { id: 4, title: "Connect Your CRM", description: "Sync contacts with your CRM." },
  { id: 5, title: "Add to Wallet", description: "Save your card in your phone's wallet." },
  { id: 6, title: "AI Business Card Scanner", description: "Scan and save info with AI." }
];

const Dashboard = () => {
  const [cardToPreview, setCardToPreview] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    displayName: "Guest",
    email: "guest@example.com",
    name: ""
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // --- User info ---
 useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (curr) => {
    setLoadingUser(true);
    if (!curr) {
      setUser({ displayName: "Guest", email: "guest@example.com", name: "" });
      setCards([]);                // <--- Clear cards when logged out
      setLoadingUser(false);
      setLoadingCards(false);      // <--- Also clear cards loading
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, "users", curr.uid));
      setUser({
        displayName: curr.displayName || "User",
        email: curr.email,
        name: (userDoc.exists() && userDoc.data().name) ? userDoc.data().name : (curr.displayName || "User")
      });
    } catch {
      setUser({
        displayName: curr.displayName || "User",
        email: curr.email,
        name: curr.displayName || "User"
      });
    }
    setLoadingUser(false);

    // ------ Load Cards HERE, after auth is ready ------
    setLoadingCards(true);
    try {
      const q = query(collection(db, "cards"), where("userId", "==", curr.uid));
      const querySnap = await getDocs(q);
      setCards(querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch {
      setCards([]);
    }
    setLoadingCards(false);
  });
  return () => unsub();
}, []);


  // --- User's cards from cards collection ---
  useEffect(() => {
    async function loadCards() {
      setLoadingCards(true);
      const curr = auth.currentUser;
      if (!curr) { setCards([]); setLoadingCards(false); return; }
      const q = query(collection(db, "cards"), where("userId", "==", curr.uid));
      const querySnap = await getDocs(q);
      setCards(querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingCards(false);
    }
    loadCards();
  }, []);

  async function handleDelete(cardId) {
    try {
      await deleteDoc(doc(db, "cards", cardId));
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to delete card. Try again." });
    }
  }

 function handleEdit(card) {
  // Gather the list of actions/links as a readable HTML string
  const actionsHTML = (Array.isArray(card.actions) && card.actions.length > 0)
    ? `<ul style="padding-left:16px;margin-top:4px">${card.actions.map(
        a => `<li>• <strong>${a.label || "-"}</strong>: <span style="color:#1366d6">${a.url || "-"}</span></li>`
      ).join("")}</ul>`
    : "<i>No actions added.</i>";

  // SweetAlert2 modal preview before editing
  
}

  const greetingName = (() => {
    if (loadingUser) return "";
    const base = typeof user.name === "string" && user.name.trim().length > 0
      ? getFirstWord(user.name)
      : typeof user.displayName === "string" && user.displayName.trim().length > 0
      ? getFirstWord(user.displayName)
      : "";
    return base ? `WELCOME, ${base.toUpperCase()}` : "WELCOME";
  })();

  const badgeLetter =
    (typeof user.name === "string" && user.name.trim().length > 0
      ? user.name.trim()[0]
      : typeof user.displayName === "string" && user.displayName.trim().length > 0
      ? user.displayName.trim()
      : "U"
    ).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} loadingUser={loadingUser} />
{cardToPreview && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    style={{ overscrollBehavior: "contain" }}
    onClick={() => setCardToPreview(null)}
  >
    <div
      className="relative w-full max-w-xs max-h-[90vh] overflow-y-auto bg-transparent rounded-3xl drop-shadow-2xl scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-blue-200"
      style={{
        margin: "auto",
        outline: "none",
        padding: 0,
        borderRadius: "1.8rem",
        boxShadow: '0 8px 40px rgba(0,0,0,0.27)',
        background: "transparent"
      }}
      onClick={e => e.stopPropagation()} // Prevent close on inner card click
    >
      {/* Close button */}
      <button
        onClick={() => setCardToPreview(null)}
        aria-label="Close preview"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          fontSize: 22,
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 1px 4px rgba(60,60,60,0.10)'
        }}
      >×</button>

      {/* The preview card */}
      <DigitalCardPreview
        profile={cardToPreview}
        actions={cardToPreview.actions}
        cardColor={cardToPreview.cardColor}
          fontColor={cardToPreview.fontColor}
  buttonLabelColor={cardToPreview.buttonLabelColor}
        socials={{
          linkedin: cardToPreview.linkedin,
          email: cardToPreview.email,
          whatsapp: cardToPreview.whatsapp,
          youtube: cardToPreview.youtube
        }}
        style={{ margin: 0 }}
      />
    </div>
  </div>
)}

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
            <span className="font-semibold text-black text-base">{loadingUser ? "..." : user.name ?? user.displayName}</span>
           
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
            {badgeLetter}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {/* Desktop greeting header */}
          <header className="mb-6 hidden md:flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold truncate">
                {greetingName}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold select-none">
              {badgeLetter}
            </div>
          </header>

          {/* Digital Cards Section */}
          <section className="mb-12">
  <h2 className="text-xl font-semibold mb-4">Digital Cards</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
    
    {/* Stylish "Create Digital Card" tile */}
    <div
      className="relative max-w-xs w-full min-h-[220px] rounded-2xl shadow-lg p-7 flex flex-col items-center justify-center bg-gradient-to-tr from-white/70 to-blue-50 border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50 hover:shadow-2xl transition"
      tabIndex={0}
      role="button"
      aria-label="Create Digital Card"
      onClick={() => navigate("/digitalcardeditor/new")}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") navigate("/digitalcardeditor/new");
      }}
      style={{
        outline: "none",
        margin: "auto"
      }}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 shadow-md border-2 border-blue-600 mb-3">
        <span className="text-blue-600 text-4xl leading-none font-bold">+</span>
      </div>
      <p className="mt-1 text-base font-semibold text-blue-700">Create Digital Card</p>
    </div>
    
    {/* Your cards */}
    {loadingCards ? (
      <div className="col-span-full text-gray-500 text-center py-10">Loading your cards...</div>
    ) : (
      cards.length === 0 ? null : cards.map(card => (
        <CardDisplay
          key={card.id}
          card={card}
          onEdit={handleEdit}
          onDelete={handleDelete}
          setCardToPreview={setCardToPreview}
          navigate={navigate}
        />
      ))
    )}
  </div>
</section>

          {/* Networking Toolkit Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Networking Toolkit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {networkingTools.map(({ id, title, description }) => (
                <div
                  key={id}
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
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
