import React from "react";
import Swal from "sweetalert2";
import {
  FaEnvelope, FaLinkedin, FaWhatsapp, FaYoutube, FaImage, FaLink
} from "react-icons/fa";

// Modal label keywords, for flexible matching
const MODAL_KEYWORDS = {
  contact: ["contact", "my info", "contacts"],
  share: ["share"],
  meeting: ["meeting", "calendar", "book"],
};

const ICONS = {
  whatsapp: <FaWhatsapp />,
  email: <FaEnvelope />,
  linkedin: <FaLinkedin />,
  custom: <FaLink />,
  youtube: <FaYoutube />
};

// Flexible modal detection based on modal: true and keywords
function detectModalType(action) {
  if (!action.modal) return null;
  const lower = (action.label || "").trim().toLowerCase();
  if (MODAL_KEYWORDS.contact.some(word => lower.includes(word))) return "contact";
  if (MODAL_KEYWORDS.share.some(word => lower.includes(word))) return "share";
  if (MODAL_KEYWORDS.meeting.some(word => lower.includes(word))) return "meeting";
  return "modal";
}
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
function handleShowContactDetails(profile) {
  // Compose info safely
  const { name, jobTitle, company, email, phone, address, website } = profile;

  Swal.fire({
    title: "My Contact Details",
    html: `
      <div style="text-align:left;font-size:15px;line-height:1.7;max-width:330px;">
        <div style="font-weight:bold;font-size:17px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:17px;vertical-align:middle;margin-right:5px;">👤</span>
          ${name || ""}
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
            <span style="color:#1565c0;">📧</span>
            <a href="mailto:${email}" style="color:#1565c0;word-break:break-all;text-decoration:none">${email}</a>
          </div>
        ` : ""}
        ${phone ? `
          <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
            <span style="color:#1565c0;">📞</span>
            <a href="tel:${phone}" style="color:#1565c0;word-break:break-all;text-decoration:none">${phone}</a>
          </div>
        ` : ""}
        ${address ? `
          <div style="margin-top:13px;display:flex;align-items:center;gap:8px;">
            <span style="color:#1565c0;">📍</span>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" style="color:#1565c0;word-break:break-all;text-decoration:none">
              ${address}
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
    width: 350,
    padding: '1.5em',
   didOpen: () => {
  const btn = Swal.getHtmlContainer().querySelector('#saveVcfBtn');
  if (btn) btn.onclick = () => downloadContactVCF(profile);
}
  });
}


function handleShareDetailsModal(profile) {
  const isMobile = window.innerWidth < 540;
  const modalWidth = isMobile ? "94vw" : 370;

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
          <div id="swal-char-count" style="font-size:12px;text-align:right;color:#888;margin-top:2px;">500 characters left</div>
        </div>
      </form>
      <div style="font-size: 11px; color: #888; margin-top:6px;line-height:1.5;">
        By submitting, you agree to SB CARDS
        <a href="https://linktr.ee/s/terms/" target="_blank" style="color:#1366d6;text-decoration:underline;">T&Cs</a> and
        <a href="https://linktr.ee/s/privacy/" target="_blank" style="color:#1366d6;text-decoration:underline;">Privacy Notice</a>,
        and to your contact details being shared with <b>${profile.name || "the owner"}</b>, who may contact you.
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
      const name = Swal.getPopup().querySelector('#swal-input-name').value.trim();
      const email = Swal.getPopup().querySelector('#swal-input-email').value.trim();
      const phone = Swal.getPopup().querySelector('#swal-input-phone').value.trim();
      const message = Swal.getPopup().querySelector('#swal-input-message').value.trim();
      if (!name || !email || !phone) {
        Swal.showValidationMessage(`Please fill in all required fields`);
        return false;
      }
      return { name, email, phone: "+27" + phone, message };
    }
  }).then(result => {
    if (result.isConfirmed) {
      // Here you might send to backend/owner/email...
      Swal.fire({
        icon: "success",
        title: "Sent!",
        text: "Your details have been shared."
      });
    }
  });
}

function handleRequestMeetingModal(profile) {
  Swal.fire({
    title: "Request a Meeting",
    html: `
      <input type="text" id="swal-meeting-name" class="swal2-input" placeholder="Name (required)" required maxlength="80" />
      <input type="email" id="swal-meeting-email" class="swal2-input" placeholder="Email (required)" required maxlength="100" />
      <textarea id="swal-meeting-message" class="swal2-textarea" rows="3" placeholder="Proposed time or message (optional)" maxlength="300"></textarea>
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
      // Optionally: send to backend/owner, show more details, etc.
      Swal.fire({
        icon: "success",
        title: "Request Sent!",
        text: "Your meeting request has been delivered."
      });
    }
  });
}


function DigitalCardPreview({
  profile = {},
  actions = [],
  cardColor = "#1a237e",
  fontColor = "#fff",
  buttonLabelColor = "#fff",
  socials = {},
  className = "",
  style = {},
  containerProps = {}
}) {
  return (
    <div
      {...containerProps}
      className={
        `relative w-full max-w-xs rounded-3xl shadow-2xl px-6 py-8 flex flex-col items-center 
         scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-blue-200 ${className}`
      }
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

      {/* Name, Job, Company, Bio */}
      <div className="text-center mb-3">
        <div className="font-bold text-2xl" style={{ color: fontColor }}>{profile.name || ""}</div>
        <div className="text-base" style={{ color: fontColor }}>{profile.jobTitle}</div>
        <div className="text-sm" style={{ color: fontColor }}>{profile.company}</div>
        <div className="text-xs mt-1" style={{ color: fontColor }}>{profile.bio}</div>
      </div>

      {/* Social Icons */}
      <div className="flex gap-3 mb-3">
        {socials.linkedin && (
          <a href={socials.linkedin} className="hover:opacity-80" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={22} style={{ color: fontColor }} />
          </a>
        )}
        {socials.youtube && (
          <a href={socials.youtube} className="hover:opacity-80" target="_blank" rel="noopener noreferrer">
            <FaYoutube size={22} style={{ color: fontColor }} />
          </a>
        )}
        {socials.email && (
          <a href={`mailto:${socials.email}`} className="hover:opacity-80" target="_blank" rel="noopener noreferrer">
            <FaEnvelope size={22} style={{ color: fontColor }} />
          </a>
        )}
        {socials.whatsapp && (
          <a href={socials.whatsapp} className="hover:opacity-80" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp size={22} style={{ color: fontColor }} />
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full mb-4 mt-2">
        {(actions || []).map((action, idx) => {
          const label = (action.label || "").trim();
          const modalType = detectModalType(action);
          const Icon = action.icon || ICONS[action.iconType] || <FaLink />;

          // Render modal actions by type
          if (modalType === "contact") {
            return (
             <button
  key={idx}
  className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
  style={{ color: buttonLabelColor, textDecoration: "none" }}
  onClick={() => handleShowContactDetails(profile)}
>
  {Icon}
  <span className="truncate">{label}</span>
</button>

            );
          }
          if (modalType === "share") {
            return (
              <button
                key={idx}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
                style={{ color: buttonLabelColor, textDecoration: "none" }}
                onClick={() => handleShareDetailsModal(profile)}
              >
                {Icon}
                <span className="truncate">{label}</span>
              </button>
            );
          }
          if (modalType === "meeting") {
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
                  {Icon}
                  <span className="truncate">{label}</span>
                </a>
              );
            }
            return (
              <button
                key={idx}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
                style={{ color: buttonLabelColor, textDecoration: "none" }}
                onClick={() => handleRequestMeetingModal(profile)}
              >
                {Icon}
                <span className="truncate">{label}</span>
              </button>
            );
          }

          // Default: regular action as link or disabled button if no url
          if (action.url && action.url.startsWith("http")) {
            return (
              <a
                key={idx}
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
                style={{ color: buttonLabelColor, textDecoration: "none" }}
              >
                {Icon}
                <span className="truncate">{label || action.url}</span>
              </a>
            );
          }
          // In case of empty url: disabled button
          return (
            <button
              key={idx}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
              style={{ color: buttonLabelColor, textDecoration: "none" }}
              disabled
            >
              {Icon}
              <span className="truncate">{label || action.url}</span>
            </button>
          );
        })}
      </div>

      {/* Main Button at Bottom */}
      {profile.buttonLabel && (
        <button
          className="w-full font-semibold rounded-2xl py-3 text-lg mt-3 shadow hover:bg-gray-100 transition text-center"
          style={{ background: "#fff", color: "#000" }}
        >
          {profile.buttonLabel}
        </button>
      )}
    </div>
  );
}

export default DigitalCardPreview;
