import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaTrash, FaPaperclip, FaEnvelope, FaLinkedin, FaGlobe, FaLink,
  FaWhatsapp, FaYoutube, FaPalette, FaImage, FaBars, FaTimes, FaEye, FaUser, FaPlus, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import { auth, db } from "../firebase";
import { doc, getDoc, getDocs,  collection, addDoc, serverTimestamp, setDoc, updateDoc,  query, where, } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getStorage, ref, uploadString, getDownloadURL,uploadBytes } from "firebase/storage";




// Icon config for social links
const ICONS = {
  linkedin: <FaLinkedin size={22} />,
  youtube: <FaYoutube size={22} />,
  email: <FaEnvelope size={22} />,
  whatsapp: <FaWhatsapp size={22} />,
  website: <FaGlobe size={22} />,
  custom: <FaLink size={22} />,
  contactForm: <FaUser size={22} />,
};

const COLOR_OPTIONS = [
  "#1a237e", "#1976d2", "#64b5f6", "#81c784", "#ffe082",
  "#f06292", "#e57373", "#263238", "#ffffff"
];

// Action Picker Modal options
const ACTION_TYPES = [
  {
    group: "Contact",
    options: [
      { type: "contactForm", label: "My Contact Details", desc: "Form for users to send their details", icon: <FaUser /> },
      { type: "bookMeeting", label: "Book a Meeting", desc: "Allow users to book a meeting with you", icon: <FaUser /> },
      { type: "shareDetails", label: "Share Your Details With Me", desc: "Users can share their info with you", icon: <FaUser /> }
    ]
  },
  {
  group: "Custom",
  options: [
    {
      type: "customButtonLink",
      label: "Button (Link)",
      desc: "Add a button that opens a website or link",
      icon: <FaLink />
    },
    {
      type: "customButtonAttachment",
      label: "Button (Attachment)",
      desc: "Add a button that opens an attached photo or document",
      icon: <FaPaperclip />
    }
  ]
},
  {
    group: "Social",
    options: [
      { type: "email", label: "Email", desc: "Add your email address", icon: <FaEnvelope /> },
      { type: "whatsapp", label: "WhatsApp", desc: "Add your WhatsApp number", icon: <FaWhatsapp /> },
      { type: "youtube", label: "YouTube Channel", desc: "Link your YouTube", icon: <FaYoutube /> },
      { type: "linkedin", label: "LinkedIn Profile", desc: "Link your LinkedIn", icon: <FaLinkedin /> },
      { type: "website", label: "Website", desc: "Add your site", icon: <FaGlobe /> },
    ]
  }
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

// Edit fields for each type of action
function ActionEditor({ action, onChange, onRemove, profile, cardId, setProfile }) {
  switch (action.type) {
case "contactForm": {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Populate fields from card profile (passed as prop) on first expand
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (expanded && !prefilledRef.current && profile) {
      let needsUpdate = false;
      const newAction = { ...action };
      if (!newAction.fullName && profile.name) { newAction.fullName = profile.name; needsUpdate = true; }
      if (!newAction.email && profile.email) { newAction.email = profile.email; needsUpdate = true; }
      if (!newAction.phone && profile.phone) { newAction.phone = profile.phone; needsUpdate = true; }
      if (!newAction.address && profile.address) { newAction.address = profile.address; needsUpdate = true; }
      if (needsUpdate) {
        prefilledRef.current = true;
        onChange(newAction);
      }
    }
    // eslint-disable-next-line
  }, [expanded, profile]);

  // Shorthand for updating local action state (for the UI/list)
  const updateField = (key, val) => onChange({ ...action, [key]: val });

  // --- THE KEY CHANGE: Save fields to the card's root fields directly ---
 async function handleSaveContactFields() {
  setSaving(true);
  setSaveMsg(null);

  if (!cardId) {
    setSaveMsg("cardId not found.");
    setSaving(false);
    return;
  }

  // Update profile in parent so Save Card copies correct info for Firestore
  setProfile(prev => ({
    ...prev,
    name: action.fullName ?? "",
    email: action.email ?? "",
    phone: action.phone ?? "",
    address: action.address ?? ""
    // more fields as you add them!
  }));

  try {
    // Optionally update the card doc too (direct updateDoc), or let handleSave handle it globally
     await setDoc(doc(db, "cards", cardId), {
       name: action.fullName ?? "",
       email: action.email ?? "",
       phone: action.phone ?? "",
       address: action.address ?? "",
       updatedAt: new Date()
     }, { merge: true });

    setSaveMsg("✔️Contact information saved successfully!");
  } catch (err) {
    setSaveMsg("Failed to update contact details.");
  }
  setSaving(false);
}

  return (
    <div className="border rounded-xl p-4 mb-4 bg-white">
      <div
        className="flex justify-between items-center mb-1 cursor-pointer"
        onClick={() => setExpanded(exp => !exp)}
      >
        <b className="flex items-center gap-2">
          <FaUser /> My Contact Details
        </b>
        <div className="flex items-center gap-2">
          <button
            className="pl-3 pr-1 text-xl"
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            tabIndex={-1}
            onClick={e => { e.stopPropagation(); setExpanded(exp => !exp); }}
            style={{ background: "none", border: "none" }}
          >
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <button
            type="button"
            className="text-red-500"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ background: "none", border: "none" }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <input
        className="w-full border-b my-1 py-1 px-2"
        placeholder="My Contact Details"
        value={action.label ?? ""}
        onChange={e => updateField("label", e.target.value)}
      />

      {expanded && (
        <div className="mt-3 space-y-2">
          <input
            className="w-full border-b py-1 px-2"
            placeholder="Full Name"
            value={action.fullName ?? ""}
            onChange={e => updateField("fullName", e.target.value)}
          />
          <input
            className="w-full border-b py-1 px-2"
            placeholder="Email"
            value={action.email ?? ""}
            onChange={e => updateField("email", e.target.value)}
          />
          <input
            className="w-full border-b py-1 px-2"
            placeholder="Phone Number"
            value={action.phone ?? ""}
            onChange={e => updateField("phone", e.target.value)}
          />
          <input
            className="w-full border-b py-1 px-2"
            placeholder="Address"
            value={action.address ?? ""}
            onChange={e => updateField("address", e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={saving}
            onClick={handleSaveContactFields}
            type="button"
          >
            {saving ? "Saving..." : "Save Contact Details"}
          </button>
          {saveMsg && <div className={`text-sm ${saveMsg.includes('fail') ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</div>}
        </div>
      )}
    </div>
  );
}case "customButtonLink":
  return (
    <div className="border rounded-xl p-4 mb-4 bg-white">
      <div className="flex justify-between items-center mb-1">
        <b className="flex items-center gap-2">
          <FaLink className="text-purple-600" />Button (Link)
        </b>
        <button className="text-red-500" onClick={onRemove} title="Delete">
          <FaTimes />
        </button>
      </div>
      <input
        className="w-full border-b my-1 py-1 px-2 font-semibold"
        placeholder="Button Text"
        value={action.label || ""}
        onChange={e => onChange({ ...action, label: e.target.value })}
        maxLength={48}
      />
      <input
        className="w-full border-b my-1 py-1 px-2"
        placeholder="Button Link (https://...)"
        value={action.url || ""}
        onChange={e => onChange({ ...action, url: e.target.value })}
        type="url"
        maxLength={256}
      />
    </div>
  );

case "customButtonAttachment":
  return (
    <div className="border rounded-xl p-4 mb-4 bg-white">
      <div className="flex justify-between items-center mb-1">
        <b className="flex items-center gap-2">
          <FaPaperclip className="text-purple-600" />Button (Attachment)
        </b>
        <button className="text-red-500" onClick={onRemove} title="Delete">
          <FaTimes />
        </button>
      </div>
      <input
        className="w-full border-b my-1 py-1 px-2 font-semibold"
        placeholder="Button Text"
        value={action.label || ""}
        onChange={e => onChange({ ...action, label: e.target.value })}
        maxLength={48}
      />
      {/* Attachment: upload/view/remove */}
      {action.attachmentUrl ? (
        <div className="flex items-center gap-3 mt-3">
          <a
            href={action.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-800 rounded-full shadow transition"
            title="View Attachment"
          >
            <FaPaperclip className="text-white text-lg" />
          </a>
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-800 rounded-full shadow transition"
            title="Remove Attachment"
            onClick={() => onChange({ ...action, attachmentUrl: "" })}
          >
            <FaTrash className="text-white text-lg" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-3">
          <label
            htmlFor={`edit-custom-attachment-${action.id}`}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-800 rounded-full cursor-pointer shadow transition"
            title="Upload Attachment"
          >
            <FaPaperclip className="text-white text-lg" />
            <input
              id={`edit-custom-attachment-${action.id}`}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;
                const storage = getStorage();
                const userId = auth.currentUser?.uid || "anonymous";
                const fileName = `custom-attachments/${userId}_${Date.now()}_${file.name}`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                onChange({ ...action, attachmentUrl: url });
              }}
            />
          </label>
        </div>
      )}
    </div>
  );

        case "bookMeeting":
      return (
        <div className="border rounded-xl p-4 mb-4 bg-white">
          <div className="flex justify-between items-center mb-1">
            <b className="flex items-center gap-2"><FaUser /> Book a Meeting</b>
            <button className="text-red-500" onClick={onRemove}><FaTimes /></button>
          </div>
          {/* Optionally show Calendly information or allow user to set link */}
          <input
            className="w-full border-b my-1 py-1 px-2"
            placeholder="Button Label"
            value={action.label || ""}
            onChange={e => onChange({ ...action, label: e.target.value })}
          />
        </div>
      );

    // --- ADD THIS: Share Your Details With Me ---
    case "shareDetails":
      return (
        <div className="border rounded-xl p-4 mb-4 bg-white">
          <div className="flex justify-between items-center mb-1">
            <b className="flex items-center gap-2"><FaUser /> Share Your Details With Me</b>
            <button className="text-red-500" onClick={onRemove}><FaTimes /></button>
          </div>
          <input
            className="w-full border-b my-1 py-1 px-2"
            placeholder="Button Label"
            value={action.label || ""}
            onChange={e => onChange({ ...action, label: e.target.value })}
          />
        </div>
      );
case "email":
case "whatsapp":
case "youtube":
case "linkedin":
case "website":
  return (
    <div className="border rounded-xl p-4 mb-4 bg-white">
      <div className="flex justify-between items-center mb-1">
        <b className="flex items-center gap-2">
          {ICONS[action.type]} {action.label}
        </b>
        <button className="text-red-500" onClick={onRemove}><FaTimes /></button>
      </div>
      <input
        className="w-full border-b my-1 py-1 px-2"
        placeholder={
          action.type === "email" ? "your@email.com" :
          action.type === "whatsapp" ? "WhatsApp Number (digits only)" :
          action.type === "linkedin" ? "LinkedIn Profile URL" :
          action.type === "youtube" ? "YouTube Channel URL" :
          action.type === "website" ? "Website URL" : ""
        }
        value={action.value || ""}
        onChange={e => {
          // Always update the action
          onChange({ ...action, value: e.target.value });
          // Also update the profile object
          setProfile(prev => ({
            ...prev,
            [action.type]: e.target.value
          }));
        }}
        type={action.type === "email" ? "email" : "text"}
      />
    </div>
  );



    case "emailSignup":
      return (
        <div className="border rounded-xl p-4 mb-4 bg-white">
          <div className="flex justify-between items-center mb-1">
            <b className="flex items-center gap-2"><FaEnvelope /> Email Signup</b>
            <button className="text-red-500" onClick={onRemove}><FaTimes /></button>
          </div>
          <input
            className="w-full border-b my-1 py-1 px-2"
            placeholder="Signup Label"
            value={action.title || ""}
            onChange={e => onChange({ ...action, title: e.target.value })}
          />
        </div>
      );
    
    default:
      return null;
  }
}

function DigitalCardPreview({
  profile,
  actions,
  cardColor,
  fontColor = "#fff",
  buttonLabelColor = "#000",
  socials = {},
  user = {},
  className = "",
  style = {},
  containerProps = {},
  socialIconColor = "#fff"  // <-- ADD THIS LINE!
}) {
  function handleShowContactDetails(e) {
    e.preventDefault();
    const isMobile = window.innerWidth < 540;
    const modalWidth = isMobile ? "94vw" : 370;

    // Get values from profile, fallback
    const name = profile.name || "";
    const jobTitle = profile.jobTitle || "";
    const company = profile.company || "";
    const email = profile.email || "";
    const phone = profile.phone || profile.mobile || profile.cell || "";
    const address = profile.address || "";
    const website = profile.website || (socials && socials.website) || "";
    const linkedin = profile.linkedin || (socials && socials.linkedin) || "";

    function getContactVCF(profile) {
      return (
        `BEGIN:VCARD\n` +
        `VERSION:3.0\n` +
        `FN:${profile.name ?? ""}\n` +
        `ORG:${profile.company ?? ""}\n` +
        (profile.jobTitle ? `TITLE:${profile.jobTitle}\n` : "") +
        (profile.website ? `URL:${profile.website}\n` : "") + 
        (profile.email ? `EMAIL:${profile.email}\n` : "") +
        (profile.phone ? `TEL;CELL:${profile.phone}\n` : "") +
        (profile.address ? `ADR;TYPE=home:;;${profile.address};;;;\n` : "") +
        (profile.linkedin ? `URL:${profile.linkedin}\n` : "") +
        `END:VCARD`
      );
    }

    function downloadContactVCF(profile) {
      const vcf = getContactVCF(profile);
      const blob = new Blob([vcf], { type: 'text/vcard' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${profile.name ?? 'contact'}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    Swal.fire({
      title: "My Contact Details",
      html: `
        <div style="text-align:left;font-size:15px;line-height:1.7;max-width:330px;">
          <div style="font-weight:bold;font-size:17px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:17px;vertical-align:middle;margin-right:5px;">👤</span>
            ${name}
          </div>
          ${(jobTitle || company) ? `
            <div style="margin-top:4px;">
              ${jobTitle ? jobTitle + " · " : ""}${company}
            </div>
          ` : ""}
          ${website ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">🌐</span>
              <a href="${website}" target="_blank" style="color:#1769aa;word-break:break-all;text-decoration:none">
                ${website}
              </a>
            </div>
          ` : ""}
          ${email ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">📧</span>
              <a href="mailto:${email}" style="color:#1769aa;word-break:break-all;text-decoration:none">${email}</a>
            </div>
          ` : ""}
          ${phone ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">📞</span>
              <a href="tel:${phone}" style="color:#1769aa;word-break:break-all;text-decoration:none">${phone}</a>
            </div>
          ` : ""}
          ${address ? `
            <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
              <span style="color:#1769aa;">📍</span>
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
          <button id="saveVcfBtn"
            style="
              display:block;
              margin:24px auto 0 auto;
              background:#1565c0;
              color:white;
              font-weight:600;
              border:none;
              border-radius:7px;
              padding:10px 22px;
              cursor:pointer;
              font-size:15px;
              box-shadow:0 2px 8px rgba(21,101,192,0.07);
              transition:background 0.2s;
            "
            onmouseover="this.style.background='#0d47a1';"
            onmouseout="this.style.background='#1565c0';"
          >
            Save to Contacts 
          </button>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: modalWidth,
      padding: '1.5em',
      didOpen: () => {
        const btn = Swal.getHtmlContainer().querySelector('#saveVcfBtn');
        if (btn) btn.onclick = () => downloadContactVCF(profile);
      }
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

  // Social
const socialActions = actions.filter(
  a =>
    ["email", "whatsapp", "youtube", "linkedin", "website"].includes(a.type) &&
    a.value && a.value.trim() !== ""
);

<div className="flex gap-4 mb-3">
  {socialActions.map(a => {
    let href = "#";
    let extraProps = {};
    if (a.type === "email") {
      href = `mailto:${a.value}`;
      // Do not add target="_blank" for mailto!
    } else if (a.type === "whatsapp") {
      const number = (a.value || "").replace(/[^0-9]/g, "");
      href = number ? `https://wa.me/${number}` : "#";
      extraProps = { target: "_blank", rel: "noopener noreferrer" };
    } else if (a.value && a.value.startsWith("http")) {
      href = a.value;
      extraProps = { target: "_blank", rel: "noopener noreferrer" };
    } else {
      href = a.value || "#";
      extraProps = { target: "_blank", rel: "noopener noreferrer" };
    }
    return (
      <a
        key={a.type}
        className="hover:opacity-80 transition"
        style={{ color: socialIconColor }}
        href={href}
        {...extraProps}
      >
        {ICONS[a.type] || <FaLink size={22} />}
      </a>
    );
  })}
</div>





  // Modal
 const modalActions = actions.filter(
  a => a.modal === true ||
       ["contactForm", "bookMeeting", "shareDetails"].includes(a.type)
)
 || [];

  return (
    <div
      {...containerProps}
      className={`relative w-full max-w-xs rounded-3xl shadow-2xl px-6 py-8 flex flex-col items-center ${className}`}
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
          width: 96, height: 96, minWidth: 96, minHeight: 96, maxWidth: 96, maxHeight: 96
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
      <div className="flex gap-4 mb-3">
        {socialActions.map(a => {
          let href = "#";
          if (a.type === "email") href = `mailto:${a.value}`;
          else if (a.type === "whatsapp") href = a.value.startsWith("http") ? a.value : `https://wa.me/${a.value}`;
          else href = a.value;
          return (
            <a
  key={a.type}
  href={href}
  className="hover:opacity-80 transition"
  style={{ color: socialIconColor }} // THIS LINE enables live color
  target="_blank"
  rel="noopener noreferrer"
>
  {ICONS[a.type] || <FaLink size={22} />}
</a>

          );
        })}
      </div>
      <div className="flex flex-col gap-3 w-full mb-4 mt-2">
  {actions.map((action, idx) => {
    // Contact Form (My Contact Details)
    if (action.type === "contactForm") {
      return (
        <button
          key={action.id || idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShowContactDetails}
        >
          {action.icon || <FaUser />}
          <span className="truncate">{action.label || "My Contact Details"}</span>
        </button>
      );
    }
    // Custom Button for Link
if (action.type === "customButtonLink") {
  return (
   <a
  key={action.id}
  href={action.url || "#"}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border bg-white/10 border-white font-semibold text-base transition hover:bg-white/20 shadow"
  style={{
    color: buttonLabelColor,
    textDecoration: "none",
    letterSpacing: ".04em"
  }}
>
  <FaLink />
  <span className="ml-1 truncate">{action.label}</span>
</a>

  );
}

// Custom Button for Attachment
if (action.type === "customButtonAttachment") {
  return (
    <a
      key={action.id || idx}
      href={action.attachmentUrl || "#"}
      target={action.attachmentUrl ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="w-full flex items-center gap-2 px-5 py-3 rounded-2xl border bg-white/10 border-white font-semibold text-base transition hover:bg-white/20 shadow"
      style={{
        color: buttonLabelColor,
        textDecoration: "none",
        letterSpacing: ".04em"
      }}
    >
      <FaPaperclip />
      <span className="truncate">{action.label}</span>
    </a>
  );
}

    // Book a Meeting
    if (action.type === "bookMeeting") {
      if (profile.calendlyLink && profile.calendlyLink.trim() !== "") {
        return (
          <a
            key={action.id || idx}
            href={profile.calendlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
            style={{ color: buttonLabelColor, textDecoration: "none" }}
          >
            {action.icon || <FaUser />}
            <span className="truncate">{action.label || "Book a Meeting"}</span>
          </a>
        );
      } else {
        return (
          <button
            key={action.id || idx}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
            style={{ color: buttonLabelColor, textDecoration: "none" }}
            onClick={handleRequestMeetingModal}
          >
            {action.icon || <FaUser />}
            <span className="truncate">{action.label || "Request a Meeting"}</span>
          </button>
        );
      }
    }
    // Share Your Details With Me
    if (action.type === "shareDetails") {
      return (
        <button
          key={action.id || idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShareDetailsModal}
        >
          {action.icon || <FaUser />}
          <span className="truncate">{action.label || "Share Your Details With Me"}</span>
        </button>
      );
    }
     if (["email", "whatsapp", "youtube", "linkedin", "website"].includes(action.type)) {/*...*/}
    // Custom fallback (shouldn't be reached)
    return null;
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
    const isModalAction = !!action.modal;
    const label = action.label?.toLowerCase() || "";

    // My Contact Details (modal)
    if (isModalAction && label.includes("contact")) {
      return (
        <button
          key={idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShowContactDetails}
        >
          {action.icon || <FaLink />}
          <span className="truncate">{action.label}</span>
        </button>
      );
    }

    // Share Your Details With Me (modal)
    if (isModalAction && label.includes("share")) {
      return (
        <button
          key={idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={handleShareDetailsModal}
        >
          {action.icon || <FaLink />}
          <span className="truncate">{action.label || "Share your details with me"}</span>
        </button>
      );
    }

    // Book a Meeting: Calendly link or modal
    if (isModalAction && label.includes("meeting")) {
      if (profile.calendlyLink && profile.calendlyLink.trim() !== "") {
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
            <span className="truncate">{action.label || "Book a Meeting"}</span>
          </a>
        );
      } else {
        return (
          <button
            key={idx}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
            style={{ color: buttonLabelColor, textDecoration: "none" }}
            onClick={handleRequestMeetingModal}
          >
            {action.icon || <FaLink />}
            <span className="truncate">{action.label || "Request a Meeting"}</span>
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

function SaveContactCSVButton({ contact }) {
 function getContactVCF(profile) {
  return (
    `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `FN:${profile.name ?? ""}\n` +
    `ORG:${profile.company ?? ""}\n` +
    (profile.jobTitle ? `TITLE:${profile.jobTitle}\n` : "") +
    (profile.website ? `URL:${profile.website}\n` : "") +
    (profile.email ? `EMAIL:${profile.email}\n` : "") +
    (profile.phone ? `TEL;CELL:${profile.phone}\n` : "") +
    (profile.address ? `ADR;TYPE=home:;;${profile.address};;;;\n` : "") +
    (profile.linkedin ? `URL:${profile.linkedin}\n` : "") +
    `END:VCARD`
  );
}

function downloadContactVCF(profile) {
  const vcf = getContactVCF(profile);
  const blob = new Blob([vcf], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${profile.name ?? 'contact'}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


 function downloadContactVCF(profile) {
  const vcf = getContactVCF(profile);
  const blob = new Blob([vcf], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${profile.name ?? 'contact'}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  return (
    <button
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-3"
      disabled={!contact}
      onClick={() => downloadContactCSV(contact)}
    >
      Save Contact (CSV)
    </button>
  );
}
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(removeUndefined)
      .filter(item => item !== undefined);  // filters undefined/null inside arrays!
  } else if (obj && typeof obj === "object") {
    const clean = {};
    for (const k in obj) {
      if (obj[k] !== undefined) clean[k] = removeUndefined(obj[k]);
    }
    return clean;
  }
  return obj;
}

export default function DigitalCardEditor() {
  const [socialIconColor, setSocialIconColor] = useState("#ffffff"); // Default white
const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSmall, setIsSmall] = useState(window.innerWidth <= 1024);
  const cardScrollRef = useRef(null);
  const formScrollRef = useRef(null);
  const { cardId } = useParams();
  const isEditMode = cardId && cardId !== "new";

  const [cardCreatedAt, setCardCreatedAt] = useState(null);
  const [activeCustomAction, setActiveCustomAction] = useState(null);
const [customButtonLabel, setCustomButtonLabel] = useState("");
const [customButtonUrl, setCustomButtonUrl] = useState("");
const [customButtonAttachmentUrl, setCustomButtonAttachmentUrl] = useState("");

 
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
    calendlyLink: "",
    phone: "",
    address: "",
    website: ""
  });
  const [actions, setActions] = useState([]);
  const [cardColor, setCardColor] = useState("#1a237e");
  const [fontColor, setFontColor] = useState("#ffffff");
  const [buttonLabelColor, setButtonLabelColor] = useState("#ffffff");

  const [showCrop, setShowCrop] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Modal UI state for the new action builder
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [activeGroup, setActiveGroup] = useState(ACTION_TYPES[0].group);

  // Load card logic and resizing events, unchanged...
 useEffect(() => {
  async function fetchCard() {
    if (!cardId || cardId === "new") {
      // ... reset logic ...
      return;
    }
    try {
      const snap = await getDoc(doc(db, "cards", cardId));
if (snap.exists()) {
  const data = snap.data();

  // Map socials from actions to top-level fields
  if (data.actions && Array.isArray(data.actions)) {
    data.actions.forEach(a => {
      if (
        ["email", "linkedin", "whatsapp", "youtube", "website"].includes(a.type) &&
        a.value && a.value.trim() !== ""
      ) {
        data[a.type] = a.value;
      }
    });
  }

  // Set profile info (name, company, socials, etc.)
  setProfile({
    name: data.name || "",
    company: data.company || "",
    jobTitle: data.jobTitle || "",
    bio: data.bio || "",
    buttonLabel: data.buttonLabel || "",
    profilePhoto: data.profilePhoto || "",
    linkedin: data.linkedin || "",
    email: data.email || "",
    whatsapp: data.whatsapp || "",
    youtube: data.youtube || "",
    calendlyLink: data.calendlyLink || "",
    phone: data.phone || "",
    address: data.address || "",
    website: data.website || ""
  });
  // Set actions for the action builder/editor
  setActions(Array.isArray(data.actions) ? data.actions : []);

  // Set card colors (add these if missing!)
  setCardColor(data.cardColor || "#1a237e");
  setFontColor(data.fontColor || "#ffffff");
  setButtonLabelColor(data.buttonLabelColor || "#000000");


  // 🟢 END BLOCK 🟢

  setProfile({
    name: data.name || "",
    company: data.company || "",
    jobTitle: data.jobTitle || "",
    bio: data.bio || "",
    buttonLabel: data.buttonLabel || "",
    profilePhoto: data.profilePhoto || "",
    linkedin: data.linkedin || "",
    email: data.email || "",
    whatsapp: data.whatsapp || "",
    youtube: data.youtube || "",
    calendlyLink: data.calendlyLink || "",
    phone: data.phone || "",
    address: data.address || "",
    website: data.website || ""
  });
        // ...rest unchanged...
      }
    } catch (e) {
      console.error("Error loading card:", e);
    }
  }
  fetchCard();
}, [cardId]);


  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load user state logic unchanged...

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
            phone: user.phone || "",
            address: user.address || "",
            website: user.website || ""
          }));
          setCardColor(user.cardColor || "#1a237e");
          setFontColor(user.fontColor || "#ffffff");
          setButtonLabelColor(user.buttonLabelColor || "#ffffff");
          setActions(Array.isArray(user.actions) && user.actions.length > 0
            ? user.actions
            : []);
        }
      }
    });
    return () => unsub();
  }, [isEditMode]);

  // Action change logic for dynamic builder
  const updateAction = (idx, updatedAction) => setActions(actions => actions.map((a, i) => i === idx ? updatedAction : a));
  const removeAction = idx => setActions(actions => actions.filter((_, i) => i !== idx));

  // Avatar file/crop logic unchanged
  function handleProfilePhotoUpload(e) {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setAvatarSrc(url);
      setShowCrop(true);
    }
  }
  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedArea(croppedAreaPixels), []);
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
      await uploadString(storageRef, img, "data_url");
      const url = await getDownloadURL(storageRef);
      setProfile(prev => ({ ...prev, profilePhoto: url }));
    } catch (e) {
      Swal.fire({ icon: "error", title: "Photo Upload Failed", text: e.message });
    }
    setAvatarSrc(null);
    setShowCrop(false);
  }

async function handleCustomActionAttachmentUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const storage = getStorage();
    const userId = auth.currentUser?.uid || "anonymous";
    const fileName = `custom-attachments/${userId}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setCustomButtonModalAttachmentUrl(url);
    Swal.fire({ icon: "success", title: "Attachment uploaded for custom button!" });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Attachment failed", text: err.message });
  }
}

// ...inside your component...
async function handleSave() {
  const curr = auth.currentUser;
  if (!curr) return alert("Not logged in.");
  if (isSaving) return;  // Block duplicate requests if already saving
  setIsSaving(true);

  const fullName = profile.name?.trim();
  if (!fullName) {
    Swal.fire({ icon: "warning", title: "Please enter your full name!" });
    setIsSaving(false);
    return;
  }

  // Clean actions: remove icon and any undefined values
  const cleanedActions = actions.map(({ icon, desc, ...rest }) => removeUndefined(rest));

  // Clean the whole profile/cardData for undefineds
  const cardDataToSave = removeUndefined({
    ...profile,
    actions: cleanedActions,
    cardColor,
    fontColor,
    buttonLabelColor,
    userId: curr.uid,
    updatedAt: serverTimestamp()
  });

  try {
    if (isEditMode) {
      await setDoc(doc(db, "cards", cardId), {
        ...cardDataToSave,
        createdAt: cardCreatedAt || serverTimestamp()
      }, { merge: true });
      Swal.fire({
        icon: "success",
        title: "Card Updated!",
        text: "Your card changes were saved."
      });
    } else {
      // Check for duplicate card before create
      const cardsRef = collection(db, "cards");
      const q = query(cardsRef, where("name", "==", fullName));
      const existing = await getDocs(q);
      if (!existing.empty) {
        Swal.fire({
          icon: "error",
          title: "Card Already Exists!",
          text: "A card with that full name already exists."
        });
        setIsSaving(false);
        return;
      }

      await addDoc(collection(db, "cards"), {
        ...cardDataToSave,
        createdAt: serverTimestamp()
      });
      Swal.fire({
        icon: "success",
        title: "Card Created!",
        text: "Your card was created and saved successfully."
      });
    }
    setIsSaving(false);
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: isEditMode ? "Error Updating Card" : "Error Creating Card",
      text: e.message
    });
    setIsSaving(false);
  }
}

  const socials = {
    linkedin: profile.linkedin,
    email: profile.email,
    whatsapp: profile.whatsapp,
    youtube: profile.youtube
  };

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
                   socialIconColor={socialIconColor}   // <-- ADD THIS LINE!
                />
              </div>
            </div>
          )}
          {/* --- Form area with dynamic action builder --- */}
          <section
            ref={formScrollRef}
            className="w-full lg:w-1/2 min-h-screen bg-white border-l px-4 sm:px-8 py-12 overflow-y-auto"
            style={{
              maxHeight: "100vh",
              overflowY: "auto"
            }}
          >
            <h1 className="text-2xl font-bold mb-4 text-center">Create Your Digital Business Card</h1>
           
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
                    {/* Profile fields below avatar */}
<div className="grid grid-cols-1 gap-3 mt-3 mb-6">
  <input
    className="w-full text-center font-bold text-xl bg-transparent focus:outline-none border-b-2 border-blue-100 py-2 placeholder-gray-500"
    value={profile.name}
    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
    placeholder="Full Name"
    maxLength={38}
  />
  <input
    className="w-full text-center text-base bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400"
    value={profile.jobTitle}
    onChange={e => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
    placeholder="Job Title"
    maxLength={44}
  />
  <input
    className="w-full text-center text-sm bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400"
    value={profile.company}
    onChange={e => setProfile(prev => ({ ...prev, company: e.target.value }))}
    placeholder="Company"
    maxLength={44}
  />
  <textarea
    className="w-full text-center text-sm bg-transparent focus:outline-none border-b border-blue-100 py-2 placeholder-gray-400 resize-none"
    rows={2}
    maxLength={110}
    value={profile.bio}
    onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
    placeholder="Short bio"
  />
</div>


            </div>
            {showCrop && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-4 w-full max-w-sm flex flex-col items-center">
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
         <div className="w-full flex flex-row items-center justify-center gap-8 my-4">
  
  {/* Card Color Picker */}
  <div className="flex flex-col items-center">
    <label className="text-xs font-semibold mb-2 flex items-center gap-2">
      <FaPalette /> Card Color
    </label>
    <input
      type="color"
      value={cardColor}
      onChange={e => setCardColor(e.target.value)}
      className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
      aria-label="Card color"
    />
  </div>
  {/* Font Color Picker */}
  <div className="flex flex-col items-center">
    <label className="text-xs font-semibold mb-2 flex items-center gap-2">
      <FaPalette /> Font Color
    </label>
    <input
      type="color"
      value={fontColor}
      onChange={e => setFontColor(e.target.value)}
      className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
      aria-label="Font color"
    />
  </div>

  {/* Button Label Color Picker */}
  <div className="flex flex-col items-center">
    <label className="text-xs font-semibold mb-2 flex items-center gap-2">
      <FaPalette /> Button Color
    </label>
    <input
      type="color"
      value={buttonLabelColor}
      onChange={e => setButtonLabelColor(e.target.value)}
      className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
      aria-label="Button label color"
    />
  </div>

  {/* Social Icon Color Picker */}
  <div className="flex flex-col items-center">
    <label className="text-xs font-semibold mb-2 flex items-center gap-2">
      <FaPalette />Icon Color
    </label>
    <input
      type="color"
      value={socialIconColor}
      onChange={e => setSocialIconColor(e.target.value)}
      className="w-10 h-10 border border-gray-400 rounded-full cursor-pointer"
      aria-label="Social icon color"
    />
  </div>
</div>


            {/* --------- ACTION BUILDER ---------- */}
           <div className="w-full">

  {actions.length === 0 && (
<div className="w-full flex justify-center py-8">
  <button
    className="
      flex items-center gap-4
      px-14 py-5
      rounded-full
      font-extrabold text-xl
      bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500
      text-white
      shadow-2xl
      hover:from-blue-600 hover:via-purple-700 hover:to-purple-800
      hover:scale-110
      transition-all duration-200
      border-none
      focus:outline-none focus:ring-4 focus:ring-purple-300
      ring-offset-2
      drop-shadow-lg
      animate-fadeIn
    "
    style={{
      letterSpacing: "0.04em",
      boxShadow: "0 10px 32px 0 rgba(72,36,160,0.38)",
      minWidth: "260px",
      minHeight: "64px",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"
    }}
    onClick={() => setShowActionPicker(true)}
  >
    <span className="flex items-center justify-center rounded-full bg-white bg-opacity-15 shadow
      w-12 h-12 mr-2 border-2 border-purple-500 hover:border-blue-400
      flex-shrink-0 transition-all duration-200">
      <FaPlus className="text-3xl drop-shadow " />
    </span>
    <span>Add Action</span>
  </button>
</div>


  )}
  {actions.length > 0 && (
    <>
     <div className="w-full">
  {actions.map((action, idx) => (
    <ActionEditor
      key={action.id || idx}
      action={action}
      onChange={updated => updateAction(idx, updated)}
      onRemove={() => removeAction(idx)}
      profile={profile}
      cardId={cardId}
      setProfile={setProfile}
    />
  ))}
</div>

      <button
        className="mt-6 text-white bg-purple-700 px-8 py-3 rounded-lg text-xl flex items-center gap-2"
        onClick={() => setShowActionPicker(true)}
      >
        <FaPlus /> Add Action
      </button>
    </>
  )}
</div>


            {/* ACTION CATEGORY PICKER */}
            {showActionPicker && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex relative">
                  <div className="w-44 border-r py-6 px-4">
                    {ACTION_TYPES.map(group => (
                      <div
                        key={group.group}
                        className={`px-3 py-2 rounded cursor-pointer mb-1 ${activeGroup === group.group ? "bg-purple-100 font-bold" : "hover:bg-gray-100"}`}
                        onClick={() => setActiveGroup(group.group)}
                      >
                        {group.group}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 py-6 px-8 max-h-[470px] overflow-auto">
                   
                    <div>
                      
                    {ACTION_TYPES.find(g => g.group === activeGroup).options.map(opt => (
  <button
    key={opt.type}
    onClick={async () => {
  if (opt.type === "customButtonLink" || opt.type === "customButtonAttachment") {
    setActiveCustomAction(opt.type);
    return;
  }
      let value = "";
      if (["email", "whatsapp", "youtube", "linkedin", "website"].includes(opt.type)) {
        value = prompt(`Enter your ${opt.label}:`)?.trim();
      }
      const { icon, desc, ...dataOnly } = opt;
      setActions(actions => [
        ...actions,
        {
          ...dataOnly,
          value: value || "",
          id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        }
      ]);
      setShowActionPicker(false);
    }}
    className="flex items-center w-full text-left py-3 gap-3 border-b hover:bg-gray-50"
    type="button"
  >
    <div className="text-xl">{opt.icon}</div>
    <div>
      <b>{opt.label}</b>
      <div className="text-xs text-gray-600">{opt.desc}</div>
    </div>
  </button>
))}

{/* FOR CUSTOM BUTTON (LINK) */}
{activeCustomAction === "customButtonLink" && (
  <div className="pt-4 px-1">
    <label className="flex items-center font-bold gap-3 text-md mb-3">
      <FaLink className="text-purple-500" /> Button Text
    </label>
    <input
      value={customButtonLabel}
      onChange={e => setCustomButtonLabel(e.target.value)}
      placeholder="e.g. Visit Portfolio"
      className="w-full py-2 px-4 rounded-2xl border-2 border-purple-200 shadow focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
    />
    <label className="flex items-center font-semibold gap-2 text-md mt-4 mb-2">
      <FaGlobe className="text-blue-500" /> Insert Link
    </label>
    <input
      value={customButtonUrl}
      onChange={e => setCustomButtonUrl(e.target.value)}
      placeholder="https://your-link.com"
      className="w-full py-2 px-4 rounded-2xl border-2 border-blue-200 shadow focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
      type="url"
    />
    <div className="w-full flex justify-end pt-4">
      <button
        className="px-7 py-2 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-800 transition"
        disabled={!customButtonLabel || !customButtonUrl}
        onClick={() => {
          setActions(actions => [
            ...actions,
            {
              type: "customButtonLink",
              label: customButtonLabel,
              url: customButtonUrl,
              id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
            }
          ]);
          setShowActionPicker(false);
          setActiveCustomAction(null);
          setCustomButtonLabel("");
          setCustomButtonUrl("");
        }}
      >
        Add Custom Link Button
      </button>
    </div>
  </div>
)}

{/* FOR CUSTOM BUTTON (ATTACHMENT) */}
{activeCustomAction === "customButtonAttachment" && (
  <div className="pt-4 px-1">
    <label className="flex items-center font-bold gap-3 text-md mb-3">
      <FaPaperclip className="text-purple-500" /> Button Text
    </label>
    <input
      value={customButtonLabel}
      onChange={e => setCustomButtonLabel(e.target.value)}
      placeholder="e.g. Download Resume"
      className="w-full py-2 px-4 rounded-2xl border-2 border-purple-200 shadow focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
    />
    <label htmlFor="custom-action-attachment" className="mt-4 flex items-center gap-2 font-semibold text-blue-700 cursor-pointer">
      <FaPaperclip className="text-lg" /> Attach Photo or Document
    </label>
    <input
      id="custom-action-attachment"
      type="file"
      accept="image/*,.pdf,.doc,.docx"
      className="hidden"
      onChange={async e => {
        const file = e.target.files[0];
        if (!file) return;
        const storage = getStorage();
        const userId = auth.currentUser?.uid || "anonymous";
        const fileName = `custom-attachments/${userId}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setCustomButtonAttachmentUrl(url);
        Swal.fire({ icon: "success", title: "Attachment uploaded!" });
      }}
    />
    <button
      type="button"
      onClick={() => document.getElementById('custom-action-attachment').click()}
      className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-800 text-white px-5 py-2 rounded-full shadow transition"
    >
      <FaPaperclip />
      {customButtonAttachmentUrl ? "Change Attachment" : "Upload Attachment"}
    </button>
    {customButtonAttachmentUrl && (
      <a
        href={customButtonAttachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 font-semibold text-blue-600 underline"
      >
        View Attachment
      </a>
    )}
    <div className="w-full flex justify-end pt-4">
      <button
        className="px-7 py-2 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-800 transition"
        disabled={!customButtonLabel || !customButtonAttachmentUrl}
        onClick={() => {
          setActions(actions => [
            ...actions,
            {
              type: "customButtonAttachment",
              label: customButtonLabel,
              attachmentUrl: customButtonAttachmentUrl,
              id: Date.now() + "-" + Math.random().toString(36).substr(2, 5),
            }
          ]);
          setShowActionPicker(false);
          setActiveCustomAction(null);
          setCustomButtonLabel("");
          setCustomButtonAttachmentUrl("");
        }}
      >
        Add Custom Attachment Button
      </button>
    </div>
  </div>
)}


                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-800"
                    onClick={() => setShowActionPicker(false)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            <button
              className="w-full bg-black text-white py-3 rounded-2xl font-bold text-lg hover:bg-gray-900 transition shadow mt-8"
              onClick={handleSave}
               disabled={showCrop || isSaving}   
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
               socialIconColor={socialIconColor}   // <-- ADD THIS LINE!
            />
          </div>
        </div>
      )}
    </div>
  );
}
