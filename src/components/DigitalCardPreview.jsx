import React from "react";
import Swal from "sweetalert2";
import {
   FaPaperclip, FaEnvelope, FaLinkedin, FaWhatsapp, FaYoutube, FaGlobe, FaImage, FaLink, FaUser
} from "react-icons/fa";
import { doc, updateDoc, increment,collection,addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Social icons config and order
const SOCIAL_ICON_MAP = {
  whatsapp: <FaWhatsapp size={22} />,
  youtube: <FaYoutube size={22} />,
  linkedin: <FaLinkedin size={22} />,
  website: <FaGlobe size={22} />,
  email: <FaEnvelope size={22} />
};
const SOCIAL_KEYS = ["whatsapp", "youtube", "linkedin", "website", "email"];

// Modal handlers

function handleShowContactDetails(profile) {
  Swal.fire({
    title: "My Contact Details",
    html: `
      <div style="text-align:left;font-size:15px;line-height:1.7;max-width:330px;">
        <div style="font-weight:bold;font-size:17px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:17px;vertical-align:middle;margin-right:5px;">👤</span>
          ${profile.name || ""}
        </div>
        ${(profile.jobTitle || profile.company) ? `<div style="margin-top:4px;">${profile.jobTitle ? profile.jobTitle + " · " : ""}${profile.company}</div>` : ""}
        ${profile.website ? `<div style="margin-top:13px;display:flex;align-items:center;gap:8px;"><span style="color:#1769aa;">🌐</span><a href="${profile.website}" target="_blank" style="color:#1769aa;">${profile.website}</a></div>` : ""}
        ${profile.email ? `<div style="margin-top:13px;display:flex;align-items:center;gap:8px;"><span style="color:#1565c0;">📧</span><a href="mailto:${profile.email}" style="color:#1565c0;">${profile.email}</a></div>` : ""}
        ${profile.phone ? `<div style="margin-top:13px;display:flex;align-items:center;gap:8px;"><span style="color:#1565c0;">📞</span><a href="tel:${profile.phone}" style="color:#1565c0;">${profile.phone}</a></div>` : ""}
        ${profile.address ? `<div style="margin-top:13px;display:flex;align-items:center;gap:8px;"><span style="color:#1565c0;">📍</span><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}" style="color:#1565c0;">${profile.address}</a></div>` : ""}
        ${profile.linkedin ? `<div style="margin-top:13px;display:flex;align-items:center;gap:8px;"><span style="font-size:15px;">🔗</span><a href="${profile.linkedin}" target="_blank" style="color:#1769aa;">LinkedIn Profile</a></div>` : ""}
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
        >
          Save to Contacts
        </button>
      </div>
    `,
    showCloseButton: true,
    showConfirmButton: false,
    width: 350,
    padding: '1.5em',
    didOpen: () => {
      // Attach handler after modal is rendered
      const btn = Swal.getHtmlContainer().querySelector('#saveVcfBtn');
      if (btn) {
        btn.onclick = () => downloadContactVCF(profile);
      }
    }
  });
}

function handleShareDetailsModal(profile) {
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
          <span style="background:#f4f4f4;border-radius:6px;padding:7px 11px;margin-right:6px;border:1px solid #d3d3d3;color:#1366d6;font-weight:500;font-size:14px;">+27</span>
          <input type="tel" id="swal-input-phone" placeholder="Phone (required)" required maxlength="11"
            style="font-size:15px;flex:1;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;"/>
        </div>
        <div style="margin-bottom:8px;">
          <textarea id="swal-input-message" rows="3" placeholder="Message (optional)" maxlength="500"
            style="font-size:14px;width:100%;padding:9px 2px 7px 2px;border:none;border-bottom:2px solid #b6bcd4;outline:none;background:transparent;resize:none;"></textarea>
        </div>
      </form>
    `,
    showCloseButton: true,
    confirmButtonText: 'Send',
    focusConfirm: false,
    width: 370,
    preConfirm: () => {
    const name = Swal.getPopup().querySelector('#swal-input-name').value.trim();
    const email = Swal.getPopup().querySelector('#swal-input-email').value.trim();
    const phone = Swal.getPopup().querySelector('#swal-input-phone').value.trim();
    const message = Swal.getPopup().querySelector('#swal-input-message').value.trim();
    if (!name || !email || !phone) {
      Swal.showValidationMessage(`Please fill in all required fields`);
      return false;
    }
    return { name, email, phone, message };
  }
}).then(result => {
  if (result.isConfirmed && profile.id) {
    handleLeadSubmit(profile.id, result.value);
    Swal.fire({
      icon: "success",
      title: "Sent!",
      text: "Your details have been shared."
    });
  }
});
}
// handleLeadSubmit saves a lead to Firestore
async function handleLeadSubmit(cardId, lead) {
  // Save lead under /cards/{cardId}/leads/
  const leadsRef = collection(db, "cards", cardId, "leads");
  await addDoc(leadsRef, {
    ...lead,                 // {name, email, phone, message}
    createdAt: serverTimestamp()
  });
}
function downloadContactVCF(profile) {
  const vcf =
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
    `END:VCARD`;

  const blob = new Blob([vcf], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${profile.name ?? 'contact'}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Increment contactsDownloaded in Firestore
  if (profile.id) {
    const cardRef = doc(db, "cards", profile.id);
    updateDoc(cardRef, {
      contactsDownloaded: increment(1)
    }).catch((error) => {
      console.error("Failed to update contactsDownloaded:", error);
    });
  }
}

function getSocialHref(type, value) {
  if (!value) return null;
  if (type === "email")    return `mailto:${value}`;
  if (type === "whatsapp") return value.startsWith("http") ? value : `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
  return value;
}

export default function DigitalCardPreview({
  profile = {},
  socials = {},
   onDownloadContact, // <-- handler from public card only!
  socialIconColor = "#fff",
  cardColor = "#1a237e",
  fontColor = "#fff",
  buttonLabelColor = "#fff",
  actions = [],
  className = "",
  style = {},
  containerProps = {},
}) {
  // Socials: always use the saved (created) card fields
 const socialsFromActions = actions
  .filter(a =>
    SOCIAL_KEYS.includes(a.type) &&
    a.value && a.value.trim() !== ""
  )
  .reduce((acc, a) => ({ ...acc, [a.type]: a.value }), {});

  // Action buttons: everything EXCEPT social link types
  const actionButtons = actions.filter(a => !SOCIAL_KEYS.includes(a.type));

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
      {/* Profile Photo */}
      <div
        className="w-24 h-24 rounded-full border-4 border-white shadow-xl mb-2 bg-white flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ width: 96, height: 96 }}>
        {profile.profilePhoto
          ? <img src={profile.profilePhoto} alt="Profile" className="object-cover h-full w-full rounded-full" />
          : <FaImage size={48} className="text-gray-300" />}
      </div>
      {/* Name, job, company, bio */}
      <div className="text-center mb-3">
        <div className="font-bold text-2xl" style={{ color: fontColor }}>{profile.name || ""}</div>
        <div className="text-base" style={{ color: fontColor }}>{profile.jobTitle}</div>
        <div className="text-sm" style={{ color: fontColor }}>{profile.company}</div>
        <div className="text-xs mt-1" style={{ color: fontColor }}>{profile.bio}</div>
      </div>
      {/* Social Icons Row */}
      <div className="flex gap-4 mb-3 items-center">
  {SOCIAL_KEYS.filter(type => socialsFromActions[type] && socialsFromActions[type].trim()).map(type => {
    const href = getSocialHref(type, socialsFromActions[type]);
    return (
      <a
        key={type}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition"
        style={{ color: socialIconColor }}
      >
        {SOCIAL_ICON_MAP[type]}
      </a>
    );
  })}
</div>

      {/* Action Buttons */}
<div className="flex flex-col gap-3 w-full mb-4 mt-2">
  {actionButtons.map((action, idx) => {
    if (action.type === "contactForm") {
      return (
        <button
          key={action.id || idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={() => handleShowContactDetails(profile)}
        >
          {action.icon || <FaUser />}
          <span className="truncate">{action.label || "My Contact Details"}</span>
        </button>
      );
    }
    if (action.type === "shareDetails") {
      return (
        <button
          key={action.id || idx}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
          onClick={() => handleShareDetailsModal(profile)}
        >
          {action.icon || <FaUser />}
          <span className="truncate">{action.label || "Share Your Details With Me"}</span>
        </button>
      );
    }
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
      }
      return (
        <a
  key={action.id || idx}
  href={action.calendlyLink}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
>
  {action.icon || <FaUser />}
  <span className="truncate">{action.label || "Book a Meeting"}</span>
</a>

      );
    }

    // ----- Custom Button for Attachment -----
    if (action.type === "customButtonAttachment") {
      return (
        <a
          key={action.id || idx}
          href={action.attachmentUrl || "#"}
          target={action.attachmentUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20 shadow"
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

    // ----- Custom Button for Link (optional explicit case) -----
    if (action.type === "customButtonLink") {
      return (
        <a
          key={action.id || idx}
          href={action.url || "#"}
          target={action.url ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20 shadow"
          style={{ color: buttonLabelColor, textDecoration: "none" }}
        >
          <FaLink />
          <span className="truncate">{action.label}</span>
        </a>
      );
    }

    // Fallback: any other custom/link action
    return (
      <a
        key={action.id || idx}
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

{/* CTA Button */}
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
