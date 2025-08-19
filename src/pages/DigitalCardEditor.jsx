import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaTrash, FaEnvelope, FaLinkedin, FaGlobe, FaLink,
  FaWhatsapp, FaYoutube, FaPalette, FaImage, FaBars, FaTimes, FaEye, FaMapMarkerAlt, FaUser
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";





const ICONS = {
  whatsapp: <FaWhatsapp />,
  email: <FaEnvelope />,
  linkedin: <FaLinkedin />,
  website: <FaGlobe />,
  custom: <FaLink />,
  youtube: <FaYoutube />
};
const COLOR_OPTIONS = [
  "#1a237e", "#1976d2", "#64b5f6", "#81c784", "#ffe082",
  "#f06292", "#e57373", "#263238", "#ffffff"
];
const PRESET_ACTIONS = [
  { label: "JCH Demo", url: "", icon: ICONS.custom },
  { label: "My Contact Details", url: "", icon: ICONS.custom },
  { label: "Share your details with me", url: "", icon: ICONS.custom },
  { label: "Book a Meeting", url: "", icon: ICONS.custom },
  { label: "The Smart Business Card", url: "", icon: ICONS.website },
  { label: "Media Production", url: "", icon: ICONS.website }
];

function getCroppedImg(imageSrc, area) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = area.width;
      canvas.height = area.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        area.x, area.y, area.width, area.height,
        0, 0, area.width, area.height
      );
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
  });
}

// ---- CARD COMPONENT: Card auto-shrinks/grows, is scrollable on desktop -----
function DigitalCardPreview({
  profile,
  actions,
  cardColor,
  fontColor = "#fff",
  buttonLabelColor = "#000",
  socials,
  user = {},
  className = "",
  style = {},
  containerProps = {}
}) {
// Handler for My Contact Details modal
  function handleShowContactDetails(e) {
    e.preventDefault();
    const isMobile = window.innerWidth < 540;
    const modalWidth = isMobile ? "94vw" : 370;

    const cellNumber = profile.phone || profile.mobile || profile.cell || "";
    const address = profile.address || "";
    const linkedin = profile.linkedin || socials.linkedin || "";
    const email = profile.email || "";

    Swal.fire({
      title: "My Contact Details",
      html: `
        <div style="text-align:left;font-size:15px;line-height:1.7;max-width:330px;">
          <div style="font-weight:bold;font-size:17px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:17px;vertical-align:middle;margin-right:5px;">👤</span>
            ${profile.name || ""}
          </div>
          <div style="margin-top:4px;">${profile.jobTitle ? profile.jobTitle + " · " : ""}${profile.company || ""}</div>
          <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
          <span style="color:#1769aa;">📧</span>

            <a href="mailto:${email}" style="color:#1769aa;word-break:break-all;text-decoration:none">${email}</a>
          </div>
          ${profile.phone ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">${FaPhone({size:15}).props.children}</span>
              <a href="tel:${profile.phone }" style="color:#1769aa;word-break:break-all;text-decoration:none">${profile.phone }</a>
            </div>
          ` : ""}
          ${address ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">${FaMapMarkerAlt({size:15}).props.children}</span>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" style="color:#1769aa;word-break:break-all;text-decoration:none">
                ${address}
              </a>
            </div>
          ` : ""}
          ${linkedin ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
             <span style="font-size:15px;vertical-align:middle;">🔗</span>

              <a href="${linkedin}" target="_blank" style="color:#1769aa;text-decoration:none">
                LinkedIn Profile
              </a>
            </div>
          ` : ""}
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: modalWidth,
      padding: '1.5em'
    });
  }


  function handleRequestMeetingModal(e) {
  e.preventDefault();
  Swal.fire({
    title: "Request a Meeting",
    html: `
      <input type="text" id="swal-meeting-name" class="swal2-input" placeholder="Name (required)" required maxlength="80" />
      <input type="email" id="swal-meeting-email" class="swal2-input" placeholder="Email (required)" required maxlength="100" />
      <textarea id="swal-meeting-message" class="swal2-textarea" rows="4" placeholder="Your proposed time or message"></textarea>
    `,
    showCloseButton: true,
    confirmButtonText: 'Send Request',
    focusConfirm: false,
    width: 370,
    preConfirm: () => {
      const name = Swal.getPopup().querySelector('#swal-meeting-name').value.trim();
      const email = Swal.getPopup().querySelector('#swal-meeting-email').value.trim();
      const message = Swal.getPopup().querySelector('#swal-meeting-message').value.trim();
      if (!name || !email) {
        Swal.showValidationMessage(`Name and email are required`);
        return false;
      }
      // Optionally: send this to backend/owner/email/etc.
      return { name, email, message };
    }
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "Request Sent!",
        text: "Your meeting request has been delivered."
      });
    }
  });
}


  // Handler for Share Your Details With Me modal
  function handleShareDetailsModal(e) {
    e.preventDefault();
    const isMobile = window.innerWidth < 540;
    const modalWidth = isMobile ? "94vw" : 370;

    let name = "";
    let email = "";
    let phone = "";
    let message = "";

    Swal.fire({
      title: "Share your details with me",
      html: `
        <form id="share-details-form" style="text-align:left;margin:0;padding:0;">
          <div style="margin-bottom:12px;">
            <input type="text" id="swal-input-name" placeholder="Name (required)" required maxlength="80" 
              style="font-size:15px;width:100%;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;"/>
          </div>
          <div style="margin-bottom:12px;">
            <input type="email" id="swal-input-email" placeholder="Email (required)" required maxlength="100"
              style="font-size:15px;width:100%;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;"/>
          </div>
          <div style="margin-bottom:12px;display:flex;align-items:center;">
            <span style="background:#f4f4f4;border-radius:6px;padding:7px 11px 7px 11px;margin-right:6px;border:1px solid #d3d3d3;color:#1366d6;font-weight:500;box-sizing:content-box;font-size:14px;">+27</span>
            <input type="tel" id="swal-input-phone" placeholder="Phone (required)" required maxlength="11"
              style="font-size:15px;flex:1;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;"/>
          </div>
          <div style="margin-bottom:8px;">
            <textarea id="swal-input-message" rows="3" placeholder="Message (optional)" maxlength="500"
              style="font-size:14px;width:100%;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;resize:none;"></textarea>
            <div id="swal-char-count" style="font-size:12px;text-align:right;color:#888;margin-top:2px;">500 characters left</div>
          </div>
        </form>
        <div style="font-size: 11px; color: #888; margin-top:6px;line-height:1.5;">
          By submitting, you agree to SB CARDS
          <a href="https://linktr.ee/s/terms/" target="_blank" style="color:#1366d6;text-decoration:underline;">T&Cs</a> and
          <a href="https://linktr.ee/s/privacy/" target="_blank" style="color:#1366d6;text-decoration:underline;">Privacy Notice</a>,
          and to your contact details being shared with <b>${profile.name || "DESMOND"}</b>, who may contact you.
        </div>
      `,
      showCloseButton: true,
      confirmButtonText: 'Send',
      focusConfirm: false,
      width: modalWidth,
      didOpen: () => {
        // Character counting for textarea
        const textarea = Swal.getPopup().querySelector('#swal-input-message');
        const counter = Swal.getPopup().querySelector('#swal-char-count');
        if (textarea && counter) {
          textarea.addEventListener('input', () => {
            const left = 500 - textarea.value.length;
            counter.textContent = left + " characters left";
          });
        }
      },
      preConfirm: () => {
        name = Swal.getPopup().querySelector('#swal-input-name').value.trim();
        email = Swal.getPopup().querySelector('#swal-input-email').value.trim();
        phone = Swal.getPopup().querySelector('#swal-input-phone').value.trim();
        message = Swal.getPopup().querySelector('#swal-input-message').value.trim();
        if (!name || !email || !phone) {
          Swal.showValidationMessage(`Please fill in all required fields`);
          return false;
        }
        return { name, email, phone: "+27" + phone, message };
      }
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Sent!",
          text: "Your details have been shared."
        });
      }
    });
  }

  return (
    <div
      {...containerProps}
      className={`relative w-full max-w-xs rounded-3xl shadow-2xl px-6 py-8 flex flex-col items-center scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-blue-200 ${className}`}
      style={{
          background: cardColor,
          color: fontColor,
        ...style
      }}
      tabIndex={0}
    >
      <div
        className="w-24 h-24 rounded-full border-4 border-white shadow-xl mb-2 bg-white flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{
          width: 96,
          height: 96,
          minWidth: 96,
          minHeight: 96,
          maxWidth: 96,
          maxHeight: 96
        }}>
        {profile.profilePhoto
          ? <img src={profile.profilePhoto} alt="Profile" className="object-cover h-full w-full rounded-full" />
          : <FaImage size={48} className="text-gray-300" />}
      </div>
      <div className="text-center mb-3">
        <div className="font-bold text-2xl">{profile.name || ""}</div>
<div className="text-base">{profile.jobTitle}</div>
<div className="text-sm">{profile.company}</div>
<div className="text-xs mt-1">{profile.bio}</div>
</div>
      <div className="flex gap-3 mb-3">
        {socials.linkedin && (
          <a href={socials.linkedin} className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer"><FaLinkedin size={22} /></a>
        )}
        {socials.youtube && (
          <a href={socials.youtube} className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer"><FaYoutube size={22} /></a>
        )}
        {socials.email && (
          <a href={`mailto:${socials.email}`} className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer"><FaEnvelope size={22} /></a>
        )}
        {socials.whatsapp && (
          <a href={socials.whatsapp} className="text-white hover:text-green-300" target="_blank" rel="noopener noreferrer"><FaWhatsapp size={22} /></a>
        )}
      </div>
      <div className="flex flex-col gap-3 w-full mb-4 mt-2">
  {(actions || []).map((action, idx) => {
    // My Contact Details
    if (
      (action.label?.toLowerCase && action.label.toLowerCase() === "my contact details") ||
      action.label === "My Contact Details"
    ) {
      return (
        <button
          key={idx}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShowContactDetails}
        >
          {action.icon || <FaLink />}
          <span className="truncate">{action.label || action.url}</span>
        </button>
      );
    }

    // Share Your Details With Me
    if (
      (action.label?.toLowerCase && action.label.toLowerCase() === "share your details with me") ||
      action.label === "Share your details with me"
    ) {
      return (
        <button
          key={idx}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShareDetailsModal}
        >
          {action.icon || <FaLink />}
          <span className="truncate">{action.label || action.url}</span>
        </button>
      );
    }

    // Book a Meeting: show Calendly if present, else Request a Meeting modal
    if (
      (action.label?.toLowerCase && action.label.toLowerCase() === "book a meeting") ||
      action.label === "Book a Meeting"
    ) {
      if (profile.calendlyLink && profile.calendlyLink.trim() !== "") {
        // Has Calendly: show as link
        return (
          <a
            key={idx}
            href={profile.calendlyLink}
            target="_blank"
            rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
          >
            {action.icon || <FaLink />}
            <span className="truncate">{action.label || action.url}</span>
          </a>
        );
      } else {
        // No Calendly: open custom request modal
        return (
          <button
            key={idx}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
            onClick={handleRequestMeetingModal}
          >
            {action.icon || <FaLink />}
            <span className="truncate">Request a Meeting</span>
          </button>
        );
      }
    }

    // Default: regular action as link
    return (
      <a
        key={idx}
        href={action.url || "#"}
        target={action.url ? "_blank" : undefined}
        rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
      >
        {action.icon || <FaLink />}
        <span className="truncate">{action.label || action.url}</span>
      </a>
    );
  })}
</div>

  {profile.buttonLabel && (
  <button
    className="w-full bg-white font-semibold rounded-2xl py-3 text-lg mt-3 shadow hover:bg-gray-100 transition text-center"
    style={{ color: "#000", textDecoration: "none" }}
  >
    {profile.buttonLabel}
  </button>
)}
    </div>
  );
}


export default function DigitalCardEditor() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSmall, setIsSmall] = useState(window.innerWidth <= 1024);
  const cardScrollRef = useRef(null);
  const formScrollRef = useRef(null);
const { cardId } = useParams();
const isEditMode = cardId && cardId !== "new";
const [cardCreatedAt, setCardCreatedAt] = useState(null);


useEffect(() => {
  async function 
  
  fetchCard() {
    // If new card, reset to blank/default fields
    if (!cardId || cardId === "new") {
      setProfile({
        name: "",
        company: "",
        jobTitle: "",
        bio: "",
        buttonLabel: "",
        profilePhoto: "",
        linkedin: "",
        email: "",
        whatsapp: "",
        youtube: "",
        calendlyLink:""
      });
      setCardColor("#1a237e");
      setActions([...PRESET_ACTIONS]);
      setCardName("");
      return;
    }
    // Otherwise load the card from Firestore
    try {
      const snap = await getDoc(doc(db, "cards", cardId));
      if (snap.exists()) {
  const data = snap.data();
  setProfile({ name: data.name || "",
          company: data.company || "",
          jobTitle: data.jobTitle || "",
          bio: data.bio || "",
          buttonLabel: data.buttonLabel || "",
          profilePhoto: data.profilePhoto || "",
          linkedin: data.linkedin || "",
          email: data.email || "",
          whatsapp: data.whatsapp || "",
          calendlyLink: data.calendlyLink || "",
          youtube: data.youtube || ""}); // ...your code
          
  setCardColor(data.cardColor || "#1a237e");
  setFontColor(data.fontColor || "#ffffff"); // <--- add this
  setButtonLabelColor(data.buttonLabelColor || "#ffffff"); // <-
  setActions(Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : [...PRESET_ACTIONS]);
  setCardName(data.cardName || "");
  setCardCreatedAt(data.createdAt || null); // <-- Add this
}

    
    } catch (e) {
   
    }
  }
  fetchCard();
  // Only runs when cardId in URL changes
}, [cardId]);


  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // State: load from user Firestore doc on login
  const [cardName, setCardName] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    company: "",
    jobTitle: "",
    bio: "",
    buttonLabel: "",
    profilePhoto: "",
    linkedin: "",
    email: "",
    whatsapp: "",
    youtube: "",
    calendlyLink: ""
  });
  const [actions, setActions] = useState([...PRESET_ACTIONS]);
  const [cardColor, setCardColor] = useState("#1a237e");
  const [fontColor, setFontColor] = useState("#ffffff");
  const [buttonLabelColor, setButtonLabelColor] = useState("#ffffff");


  const [showCrop, setShowCrop] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Populate form from user profile, but cards are saved separately
 useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (curr) => {
    if (!curr) return;
    const docRef = doc(db, "users", curr.uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const user = snapshot.data();
      if (!isEditMode) { // Only set defaults for new card
        setProfile(prev => ({
          ...prev,
          name: user.name || "",
          company: user.company || "",
          jobTitle: user.jobTitle || "",
          bio: user.bio || "",
          buttonLabel: user.buttonLabel || "",
          profilePhoto: user.profilePhoto || "",
          linkedin: user.linkedin || "",
          email: user.email || "",
          whatsapp: user.whatsapp || "",
          youtube: user.youtube || "",
          calendlyLink: user.calendlyLink || "",
        }));
        setCardColor(user.cardColor || "#1a237e");
         setfontColor(user.fontColor || "#1a237e");
        setButtonLabelColor(user.buttonLabelColor || "#000000");
        setActions(Array.isArray(user.actions) && user.actions.length > 0
          ? user.actions
          : [...PRESET_ACTIONS]);
      }
    }
  });
  return () => unsub();
}, [isEditMode]);


  const updateProfileField = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const updateAction = (i, k, v) => setActions(a => a.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeAction = (i) => setActions(a => a.filter((_, idx) => idx !== i));
  const addAction = () => setActions(a => [...a, { label: "", url: "", icon: ICONS.custom }]);
  const socials = {
    linkedin: profile.linkedin,
    email: profile.email,
    whatsapp: profile.whatsapp,
    youtube: profile.youtube
  };

 // 1. Photo select handler (fix: use files)
function handleProfilePhotoUpload(e) {
  if (e.target.files && e.target.files[0]) {
    const url = URL.createObjectURL(e.target.files[0]); // <-- FIXED!
    setAvatarSrc(url);
    setShowCrop(true);
  }
}

// 2. Crop complete callback (no change)
const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedArea(croppedAreaPixels), []);

// 3. Crop confirm with Firebase Storage upload
async function handleCropConfirm() {
  if (!avatarSrc || !croppedArea) {
    setShowCrop(false);
    setAvatarSrc(null);
    return;
  }
  const img = await getCroppedImg(avatarSrc, croppedArea);

  try {
    const storage = getStorage();
    const userId = auth.currentUser?.uid || "anonymous";
    const fileName = `profilePhotos/${userId}_${Date.now()}.png`;
    const storageRef = ref(storage, fileName);

    // Upload data url to Storage
    await uploadString(storageRef, img, "data_url");
    // Get downloadable URL for image
    const url = await getDownloadURL(storageRef);

    setProfile(prev => ({ ...prev, profilePhoto: url }));
  } catch (e) {
    Swal.fire({ icon: "error", title: "Photo Upload Failed", text: e.message });
  }

  setAvatarSrc(null);
  setShowCrop(false);
}


async function handleSave() {
  const curr = auth.currentUser;
  if (!curr) return alert("Not logged in.");
  if (!cardName.trim()) {
    Swal.fire({ icon: "warning", title: "Please enter a Card Name!" });
    return;
  }
  try {
    const cardData = {
      cardName,
      ...profile,
      actions: actions.map(a => ({
        label: a.label,
        url: a.url,
        iconType: a.iconType || "custom"
      })),
      cardColor,
       fontColor,
       buttonLabelColor,
      userId: curr.uid,
      updatedAt: serverTimestamp()
    };

    try {
  // ...setup cardData
  if (isEditMode) {
    await setDoc(doc(db, "cards", cardId), {
      ...cardData,
      createdAt: cardCreatedAt || serverTimestamp()
    }, { merge: true });
    console.log("Calling Swal for update");         // <<< Add this!
    Swal.fire({
      icon: "success",
      title: "Card Updated!",
      text: "Your card changes were saved."
    });
  } else {
    await addDoc(collection(db, "cards"), {
      ...cardData,
      createdAt: serverTimestamp()
    });
    console.log("Calling Swal for create");         // <<< Add this!
    Swal.fire({
      icon: "success",
      title: "Card Created!",
      text: "Your card was created and saved successfully."
    });
  }
} catch (e) {
  console.error("ERROR SAVING:", e);
  Swal.fire({
    icon: "error",
    title: isEditMode ? "Error Updating Card" : "Error Creating Card",
    text: e.message
  });
}
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: isEditMode ? "Error Updating Card" : "Error Creating Card",
      text: e.message
    });
  }
}
// Helper to convert the icon prop (can be improved as needed)
function getIconTypeFromAction(action) {
  if (action.iconType) return action.iconType;
  if (!action.icon) return "custom";
  if (action.icon === ICONS.whatsapp) return "whatsapp";
  if (action.icon === ICONS.email) return "email";
  if (action.icon === ICONS.linkedin) return "linkedin";
  if (action.icon === ICONS.website) return "website";
  if (action.icon === ICONS.youtube) return "youtube";
  return "custom";
}


  return (
    <div className="min-h-screen bg-gray-100 relative overflow-x-hidden">
      {(!isSmall || sidebarOpen) && (
        <aside className={`fixed top-0 left-0 z-40 bg-white shadow-lg ${isSmall ? "w-72 h-full" : "w-64 h-screen"} transition-transform`}>
          <Sidebar
            open
            onClose={() => setSidebarOpen(false)}
            user={profile}
            loadingUser={false}
            activeKey="card-editor"
          />
        </aside>
      )}
      {isSmall && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {isSmall && !sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-300 shadow"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>
      )}
      {/* Mobile preview button, always top right */}
      {isSmall && (
        <button
          className="fixed top-4 right-5 z-50 bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition"
          style={{ boxShadow: "0 2px 18px 0 rgba(60,60,90,0.13)" }}
          onClick={() => setShowPreview(true)}
          aria-label="Preview Card"
        >
          <FaEye size={22} />
        </button>
      )}

      <main className={`${!isSmall ? "lg:ml-64" : ""} transition-all`}>
        <div className="flex flex-col lg:flex-row w-full max-w-screen">
          {/* Card: scrollable, independent from form on desktop */}
          {!isSmall && (
            <div className="lg:w-1/2 min-h-screen bg-gray-50 flex items-start justify-center">
              <div
                ref={cardScrollRef}
                className="flex flex-col items-center w-full"
                style={{
                  marginTop: "3rem",
                  maxHeight: "calc(100vh - 3rem)",
                  overflowY: "auto"
                }}
              >
                <DigitalCardPreview
                  profile={profile}
                  actions={actions}
                  cardColor={cardColor}
                  fontColor={fontColor}
                  buttonLabelColor={buttonLabelColor}
                  socials={socials}
                  style={{ margin: "auto" }}
                />
              </div>
            </div>
          )}
          {/* Form: scrollable, independent from card */}
          <section
            ref={formScrollRef}
            className="w-full lg:w-1/2 min-h-screen bg-white border-l px-4 sm:px-8 py-12 overflow-y-auto"
            style={{
              maxHeight: "100vh",
              overflowY: "auto"
            }}
          >
            <h1 className="text-2xl font-bold mb-4 text-center">Create Your Digital Business Card</h1>
            <input
              className="w-full border-b-2 border-blue-300 py-3 px-2 rounded text-xl font-semibold mb-5 text-center focus:outline-none"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder="Card Name"
              maxLength={50}
            />
            <div className="flex flex-col items-center">
              <label htmlFor="profilePhoto" className="cursor-pointer">
                <div
                  className="w-24 h-24 rounded-full border-4 border-blue-300 shadow flex items-center justify-center overflow-hidden bg-gray-100 mb-1 flex-shrink-0"
                  style={{
                    width: 96, height: 96, minWidth: 96, minHeight: 96, maxWidth: 96, maxHeight: 96
                  }}>
                  {profile.profilePhoto
                    ? <img src={profile.profilePhoto} alt="Profile" className="object-cover h-full w-full rounded-full" />
                    : <FaImage size={36} className="text-gray-300" />}
                </div>
              </label>
              <input id="profilePhoto" type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
              <span className="text-xs text-gray-400 mb-4">Click avatar to upload</span>
            </div>
            {showCrop && (
  <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-4 w-full max-w-sm flex flex-col items-center">
      {/* Crop area should NOT use absolute position */}
      <div className="relative w-full flex justify-center items-center" style={{height: 250}}>
        <Cropper
          image={avatarSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      {/* Buttons below */}
      <div className="flex justify-between gap-3 mt-4 w-full">
        <button
          className="flex-1 px-4 py-2 rounded bg-gray-200"
          onClick={() => {
            setShowCrop(false);
            setAvatarSrc(null);
          }}
        >
          Cancel
        </button>
        <button
          className="flex-1 px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleCropConfirm}
        >
          Select
        </button>
      </div>
    </div>
  </div>
)}

            <div className="grid grid-cols-1 gap-3 mt-2">
              <input className="w-full text-center font-bold text-xl bg-transparent focus:outline-none border-b-2 border-blue-100 py-2 placeholder-gray-500"
                     value={profile.name} onChange={e => updateProfileField("name", e.target.value)} placeholder="Full Name" maxLength={38} />
              <input className="w-full text-center text-base bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400"
                     value={profile.jobTitle} onChange={e => updateProfileField("jobTitle", e.target.value)} placeholder="Job Title" maxLength={44} />
              <input className="w-full text-center text-sm bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400"
                     value={profile.company} onChange={e => updateProfileField("company", e.target.value)} placeholder="Company" maxLength={44} />
              <textarea className="w-full text-center text-sm bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400 resize-none"
                rows={2} maxLength={110} value={profile.bio} onChange={e => updateProfileField("bio", e.target.value)} placeholder="Short bio" />
            </div>
            <div className="w-full flex flex-col items-center mt-5 mb-4">
              <label className="text-xs font-semibold mb-2 flex items-center gap-2"><FaPalette /> Card Color</label>
              <div className="flex gap-2 flex-wrap justify-center">
                {COLOR_OPTIONS.map((c, i) => (
                  <button key={i} className={`w-8 h-8 rounded-full border-2 ${cardColor === c ? "border-black" : "border-gray-200"}`}
                          style={{ background: c }} onClick={() => setCardColor(c)} aria-label={c} type="button" />
                ))}
                <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)}
                       className="w-8 h-8 border border-gray-400 rounded-full ml-2" aria-label="Custom color" />
              </div>
            </div>
            <div className="w-full flex flex-col items-center mt-3">
  <label className="text-xs font-semibold mb-2 flex items-center gap-2"><FaPalette /> Font Color</label>
  <input
    type="color"
    value={fontColor}
    onChange={e => setFontColor(e.target.value)}
    className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer mb-3"
    aria-label="Font color"
  />
</div>
<div className="w-full flex flex-col items-center mt-2">
  <label className="text-xs font-semibold mb-2 flex items-center gap-2"><FaPalette /> Button Label Color</label>
  <input
    type="color"
    value={buttonLabelColor}
    onChange={e => setButtonLabelColor(e.target.value)}
    className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
    aria-label="Button label color"
  />
</div>

            <div className="w-full">
              <h3 className="font-semibold text-center mb-2">Links & Actions</h3>
              {actions.map((a, idx) => (
                <div key={idx} className="mb-4">
                  <label className="block text-xs font-semibold mb-1" htmlFor={`label-input-${idx}`}>Button Label</label>
                  <input
                    id={`label-input-${idx}`}
                    className="w-full border-b border-blue-100 px-3 py-2 outline-none mb-2"
                    value={a.label}
                    onChange={e => updateAction(idx, "label", e.target.value)}
                    placeholder="Button Label"
                    autoComplete="off"
                    maxLength={44}
                  />
                  <label className="block text-xs font-semibold mb-1" htmlFor={`url-input-${idx}`}>Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`url-input-${idx}`}
                      className="flex-1 border-b border-blue-100 px-3 py-2 outline-none overflow-x-auto whitespace-nowrap scrollbar-thin"
                      style={{ minWidth: 0, WebkitOverflowScrolling: "touch" }}
                      value={a.url}
                      onChange={e => updateAction(idx, "url", e.target.value)}
                      placeholder="Link (optional)"
                      autoComplete="off"
                      maxLength={400}
                    />
                    <button
                      className="border border-gray-200 bg-red-100 rounded px-3 py-2 text-red-600 flex-shrink-0"
                      onClick={() => removeAction(idx)}
                      type="button"
                      aria-label="Remove">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="mt-1 w-full rounded-2xl bg-blue-600 text-white font-bold py-2 hover:bg-blue-700 transition"
                type="button"
                onClick={addAction}
              >Add Action</button>
            </div>
            <div className="w-full flex flex-col gap-2 mb-6 mt-6">
              <input className="w-full border-b border-blue-100 py-2 outline-none text-center" value={profile.linkedin}
                     placeholder="LinkedIn Profile URL" onChange={e => updateProfileField("linkedin", e.target.value)} />
              <input className="w-full border-b border-blue-100 py-2 outline-none text-center" value={profile.youtube}
                     placeholder="YouTube Channel URL" onChange={e => updateProfileField("youtube", e.target.value)} />
              <input className="w-full border-b border-blue-100 py-2 outline-none text-center" value={profile.email}
                     placeholder="Email" onChange={e => updateProfileField("email", e.target.value)} type="email" />
              <input className="w-full border-b border-blue-100 py-2 outline-none text-center" value={profile.whatsapp}
                     placeholder="WhatsApp Link (https://wa.me/…)" onChange={e => updateProfileField("whatsapp", e.target.value)} />
                     
              <input
    type="url"
    className="w-full border-b border-blue-100 py-2 outline-none text-center"
    value={profile.calendlyLink || ""}
    placeholder="Calendly Link (optional)"
    onChange={e => updateProfileField("calendlyLink", e.target.value)}
  /></div>
            <input className="w-full border-b border-blue-100 py-2 mt-6 mb-4 text-base font-semibold bg-transparent focus:outline-none placeholder-gray-400 text-center"
                   value={profile.buttonLabel} onChange={e => updateProfileField("buttonLabel", e.target.value)}
                   placeholder="Button label (e.g. Connect with me)" />

                   
            <button
  className="w-full bg-black text-white py-3 rounded-2xl font-bold text-lg hover:bg-gray-900 transition shadow"
  onClick={handleSave}
  disabled={showCrop}  // Prevents save while cropping
>
  Save Card
</button>
          </section>
        </div>
      </main>
      {isSmall && showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative w-full max-w-xs max-h-[90vh] overflow-y-auto scrollbar-thin"
            onClick={e => e.stopPropagation()}>
            <button className="fixed top-4 right-5 text-white text-3xl z-10" onClick={() => setShowPreview(false)} style={{ background: "rgba(0,0,0,0.05)", borderRadius: "50%", padding: "2px" }}><FaTimes /></button>
            <DigitalCardPreview
              profile={profile}
              actions={actions}
              cardColor={cardColor}
              fontColor={fontColor}
              buttonLabelColor={buttonLabelColor}
              socials={socials}
              className="max-h-[85vh] overflow-y-auto"
              style={{ position: "relative" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
