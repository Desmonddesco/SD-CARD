import React, { useState, useEffect } from "react";
import { FaTrash, FaPhone, FaEnvelope, FaLinkedin, FaGlobe, FaLink, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Sidebar from "../components/Sidebar"; // Import your shared Sidebar

// Icon set for card fields
const ICONS = {
  call: <FaPhone className="text-blue-600" />,
  email: <FaEnvelope className="text-red-500" />,
  linkedin: <FaLinkedin className="text-blue-700" />,
  website: <FaGlobe className="text-green-700" />,
  custom: <FaLink className="text-neutral-600" />,
};

const CARD_FIELDS = [
  { type: "call", label: "Call", icon: ICONS.call },
  { type: "email", label: "Email", icon: ICONS.email },
  { type: "linkedin", label: "LinkedIn", icon: ICONS.linkedin },
  { type: "website", label: "Website", icon: ICONS.website },
  { type: "custom", label: "Custom Link", icon: ICONS.custom },
];

const STYLES = [
  { key: "modern", name: "Modern", bg: "bg-gradient-to-br from-purple-500 to-pink-400" },
  { key: "classic", name: "Classic", bg: "bg-gray-700" },
  { key: "light", name: "Light", bg: "bg-white border" },
];

// Card preview (responsive, mobile look)
function DigitalCardPreview({ fields, profile, styleKey, onProfileEdit }) {
  const styleObj = STYLES.find((st) => st.key === styleKey) || STYLES[0];
  return (
    <div className={`w-full max-w-[325px] rounded-3xl shadow-xl p-4 ${styleObj.bg} min-h-[500px] flex flex-col items-center mx-auto`}>
      <div className="text-right w-full">
        <span className="font-bold text-gray-200 text-xs">Save Contact</span>
      </div>
      <div className="rounded-full bg-white h-20 w-20 mb-6 mt-4 flex items-center justify-center shadow-lg text-2xl overflow-hidden">
        {profile.profilePhoto ? (
          <img src={profile.profilePhoto} alt="Profile" className="h-20 w-20 object-cover rounded-full" />
        ) : "👤"}
      </div>
      <input
        value={profile.name || ""}
        onChange={e => onProfileEdit("name", e.target.value)}
        className="font-bold text-lg mb-1 text-center text-white bg-transparent outline-none border-b border-white/30 pb-1 w-full max-w-[180px]"
        style={{ background: "transparent" }}
      />
      <input
        value={profile.jobTitle || ""}
        onChange={e => onProfileEdit("jobTitle", e.target.value)}
        className="font-medium text-sm mb-1 text-center text-white/80 bg-transparent outline-none border-b border-white/20 pb-1 w-full max-w-[180px]"
        placeholder="Job Title"
        style={{ background: "transparent" }}
      />
      <input
        value={profile.company || ""}
        onChange={e => onProfileEdit("company", e.target.value)}
        className="font-medium text-xs mb-6 text-center text-white/70 bg-transparent outline-none border-b border-white/10 pb-1 w-full max-w-[180px]"
        placeholder="Company"
        style={{ background: "transparent" }}
      />
      <div className="space-y-3 w-full">
        {fields.map((field, idx) => field.value && (
          <a
            href={field.type === "email"
              ? `mailto:${field.value}`
              : field.type === "call"
              ? `tel:${field.value}`
              : field.value.startsWith("http")
              ? field.value
              : ["linkedin", "website", "custom"].includes(field.type)
              ? `https://${field.value.replace(/^https?:\/\//, "")}`
              : "#"}
            target="_blank"
            rel="noopener noreferrer"
            key={idx}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black shadow hover:bg-gray-100 cursor-pointer transition"
          >
            <span>{ICONS[field.type] || ICONS.custom}</span>
            <span className="truncate">{field.value}</span>
          </a>
        ))}
      </div>
      <div className="mt-auto pt-6 w-full text-center">
        <span className="bg-black/20 text-white text-xs px-3 py-1 rounded-full">{styleObj.name} Style</span>
      </div>
    </div>
  );
}

// Editor for card fields
function DigitalCardFieldsEditor({ fields, setFields }) {
  const [newType, setNewType] = useState("call");
  const [newValue, setNewValue] = useState("");

  const addSection = () => {
    if (!newValue.trim()) return;
    setFields([...fields, { type: newType, value: newValue }]);
    setNewValue("");
  };

  const removeSection = (idx) => setFields(fields.filter((_, i) => i !== idx));

  const updateSection = (idx, value) => {
    const updated = [...fields];
    updated[idx].value = value;
    setFields(updated);
  };

  return (
    <>
      <h2 className="font-bold text-lg mb-2">Your Card Actions</h2>
      <ul className="space-y-2 mb-5">
        {fields.map((field, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="w-8">{ICONS[field.type]}</span>
            <input
              value={field.value}
              onChange={e => updateSection(idx, e.target.value)}
              className="border px-2 py-1 rounded flex-1"
            />
            <button type="button" aria-label="Remove" onClick={() => removeSection(idx)}>
              <FaTrash className="text-lg text-gray-400 hover:text-red-500 transition" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mb-4">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {CARD_FIELDS.map(opt => (
            <option value={opt.type} key={opt.type}>{opt.label}</option>
          ))}
        </select>
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="Value (e.g. number, url)"
          className="border px-2 py-1 rounded flex-1"
        />
        <button type="button" className="bg-black text-white px-4 py-1 rounded" onClick={addSection}>
          Add
        </button>
      </div>
    </>
  );
}

// Card style choices
function CardStylePicker({ styleKey, setStyleKey }) {
  return (
    <>
      <h2 className="font-bold text-lg mb-2 mt-5">Card Style</h2>
      <div className="flex gap-4 mb-4">
        {STYLES.map(st => (
          <button
            key={st.key}
            type="button"
            className={`w-20 h-14 rounded-xl border-2 ${styleKey === st.key ? 'border-black ring-2 ring-black' : 'border-transparent'} flex items-center justify-center text-xs font-bold`}
            onClick={() => setStyleKey(st.key)}
          >{st.name}</button>
        ))}
      </div>
    </>
  );
}

export default function DigitalCardEditor() {
  const [fields, setFields] = useState([]);
  const [styleKey, setStyleKey] = useState("modern");
  const [profile, setProfile] = useState({
    name: "",
    company: "",
    jobTitle: "",
    profilePhoto: "",
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch user/card info
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const curr = auth.currentUser;
      if (!curr) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "users", curr.uid);
        const userSnap = await getDoc(docRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            name: data.displayName || data.name || "",
            company: data.company || "",
            jobTitle: data.jobTitle || "",
            profilePhoto: data.profilePhoto || "",
          });
          setFields([
            ...(data.phone ? [{ type: "call", value: data.phone }] : []),
            ...(data.email ? [{ type: "email", value: data.email }] : []),
            ...(data.linkedin ? [{ type: "linkedin", value: data.linkedin }] : []),
            ...(data.website ? [{ type: "website", value: data.website }] : []),
            ...(data.customLinks ? data.customLinks.map(link => ({ type: "custom", value: link })) : []),
          ]);
          if (data.cardStyle && STYLES.some(st => st.key === data.cardStyle)) setStyleKey(data.cardStyle);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Edit name/company/title in card preview
  const handleProfileEdit = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Save to Firestore
  const handleSave = async () => {
    const curr = auth.currentUser;
    if (!curr) {
      alert("Not logged in.");
      return;
    }
    try {
      await setDoc(
        doc(db, "users", curr.uid),
        {
          displayName: profile.name,
          name: profile.name,
          company: profile.company,
          jobTitle: profile.jobTitle,
          profilePhoto: profile.profilePhoto,
          phone: fields.find(f => f.type === "call")?.value || "",
          email: fields.find(f => f.type === "email")?.value || "",
          linkedin: fields.find(f => f.type === "linkedin")?.value || "",
          website: fields.find(f => f.type === "website")?.value || "",
          customLinks: fields.filter(f => f.type === "custom").map(f => f.value),
          cardStyle: styleKey,
        },
        { merge: true }
      );
      alert("Card updated!");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  // Sidebar user info for reuse
  const [user, setUser] = useState({ displayName: "", email: "" });
  const [loadingUser, setLoadingUser] = useState(true);
  useEffect(() => {
    setLoadingUser(true);
    const curr = auth.currentUser;
    if (!curr) {
      setUser({ displayName: "", email: "" });
      setLoadingUser(false);
      return;
    }
    getDoc(doc(db, "users", curr.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUser({
          displayName: data.displayName || data.name || "",
          email: data.email || curr.email,
        });
      } else {
        setUser({ displayName: curr.displayName || "", email: curr.email });
      }
      setLoadingUser(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        loadingUser={loadingUser}
        activeKey="card-editor" // so the menu highlights "Card Editor"
      />

      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile (dashboard style) */}
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
        <main className="flex-1 flex items-center justify-center overflow-auto p-4 sm:p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-12 w-full max-w-6xl">
            {loading ? (
              <div className="text-center w-full py-32 text-gray-500">Loading card...</div>
            ) : (
              <>
                <DigitalCardPreview
                  fields={fields}
                  profile={profile}
                  styleKey={styleKey}
                  onProfileEdit={handleProfileEdit}
                />
                <div className="flex-1 max-w-lg">
                  <DigitalCardFieldsEditor fields={fields} setFields={setFields} />
                  <CardStylePicker styleKey={styleKey} setStyleKey={setStyleKey} />
                  <button
                    onClick={handleSave}
                    className="mt-6 w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-900 transition"
                    type="button"
                  >
                    Save Card
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
