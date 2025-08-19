import React from "react";
import {
  FaEnvelope, FaLinkedin, FaWhatsapp, FaYoutube, FaImage, FaLink
} from "react-icons/fa";

const ICONS = {
  whatsapp: <FaWhatsapp />,
  email: <FaEnvelope />,
  linkedin: <FaLinkedin />,
  custom: <FaLink />,
  youtube: <FaYoutube />
};

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
          // Use custom icon or fallback
          const Icon = action.icon || ICONS[action.iconType] || <FaLink />;
          // Render as Button (if no url) or Anchor (if url)
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
                <span className="truncate">{action.label || action.url}</span>
              </a>
            );
          }
          return (
            <button
              key={idx}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl border border-white bg-white/10 font-semibold text-base transition hover:bg-white/20"
              style={{ color: buttonLabelColor, textDecoration: "none" }}
              // Add your custom onClick handlers here if needed!
            >
              {Icon}
              <span className="truncate">{action.label || action.url}</span>
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
