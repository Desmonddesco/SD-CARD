import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, arrayUnion, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import DigitalCardPreview from "./DigitalCardPreview";

// Gradient backgrounds
const gradientBackgrounds = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #5f72bd 0%, #9b59b6 100%)",
  "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
  "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
  "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
  "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)",
  "linear-gradient(135deg, #70e1f5 0%, #ffd194 100%)"
];

// Lead share modal (called only from public page)
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

// Firestore save
async function handleLeadSubmit(cardId, lead) {
  const leadsRef = collection(db, "cards", cardId, "leads");
  await addDoc(leadsRef, { ...lead, createdAt: serverTimestamp() });
}

// Download contact and record analytics event (with location)
async function downloadContactVCF(profile) {
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

  // Analytics: increment field and write subcollection log with location
  if (profile.id) {
    const cardRef = doc(db, "cards", profile.id);
    updateDoc(cardRef, {
      contactsDownloaded: increment(1)
    }).catch(() => {});

    try {
      const res = await fetch('https://ipapi.co/json/');
      const geo = await res.json();
      await addDoc(collection(db, "cards", profile.id, "views"), {
        createdAt: serverTimestamp(),
        downloadContact: true,
        location: {
          city: geo.city,
          region: geo.region,
          country: geo.country_name,
          lat: geo.latitude,
          lng: geo.longitude,
          org: geo.org
        }
      });
    } catch {
      await addDoc(collection(db, "cards", profile.id, "views"), {
        createdAt: serverTimestamp(),
        downloadContact: true
      });
    }
  }
}

function getGradientFromColor(cardColor) {
  if (!cardColor) return gradientBackgrounds[0];
  const hex = cardColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    const s = h > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const gradientIndex = Math.floor(h * gradientBackgrounds.length);
  return gradientBackgrounds[gradientIndex] || gradientBackgrounds[0];
}

function slugifyFullName(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function PublicCardView() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [firestoreCardId, setFirestoreCardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Visitor analytics tracker (main analytics increment)
  useEffect(() => {
    let visitId = localStorage.getItem("anonymousVisitorId");
    if (!visitId) {
      visitId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("anonymousVisitorId", visitId);
    }
    if (firestoreCardId) {
      const cardRef = doc(db, "cards", firestoreCardId);
      updateDoc(cardRef, {
        views: increment(1),
        visitors: arrayUnion(visitId),
      }).catch(() => {});
    }
  }, [firestoreCardId]);

  // Log each view with location, but NOT if also logging a download in the same session
  useEffect(() => {
    if (!firestoreCardId) return;
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(geo => {
        const viewDoc = {
          createdAt: serverTimestamp(),
          location: {
            city: geo.city,
            region: geo.region,
            country: geo.country_name,
            lat: geo.latitude,
            lng: geo.longitude,
            org: geo.org
          }
        };
        addDoc(collection(db, "cards", firestoreCardId, "views"), viewDoc);
      })
      .catch(() => {
        addDoc(collection(db, "cards", firestoreCardId, "views"), {
          createdAt: serverTimestamp()
        });
      });
  }, [firestoreCardId]);

  // Traffic source tracker (?src=)
  useEffect(() => {
    if (!firestoreCardId) return;
    const url = new URL(window.location.href);
    const src = url.searchParams.get("src");
    if (src) {
      const cardRef = doc(db, "cards", firestoreCardId);
      updateDoc(cardRef, {
        [`trafficSources.${src}`]: increment(1)
      }).catch(() => {});
    }
  }, [firestoreCardId]);

  // Fetch card from Firestore
  useEffect(() => {
    async function fetchCard() {
      if (!cardId) {
        setError("Card name not provided in URL");
        setLoading(false);
        return;
      }
      try {
        const customUrl = `${window.location.origin}/card/${cardId.toLowerCase()}`;
        const q = query(
          collection(db, "cards"),
          where("uniqueUrl", "==", customUrl)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0];
          const cardData = docRef.data();
          const id = docRef.id;
          if (cardData.actions && Array.isArray(cardData.actions)) {
            cardData.actions.forEach(a => {
              if (
                ["email", "linkedin", "whatsapp", "youtube", "website"].includes(a.type) &&
                a.value && a.value.trim() !== ""
              ) {
                cardData[a.type] = a.value;
              }
            });
          }
          setCard(cardData);
          setFirestoreCardId(id);
        } else {
          setError("Card not found.");
        }
      } catch (err) {
        setError("Failed to load card.");
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [cardId]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}
      >
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Card Not Found</h1>
          <p className="text-white mb-4">{error}</p>
          <a
            href="/"
            className="text-blue-200 hover:text-blue-100 underline"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const socials = {
    linkedin: card?.linkedin,
    email: card?.email,
    whatsapp: card?.whatsapp,
    youtube: card?.youtube,
    website: card?.website
  };

  const currentUrl = `${window.location.origin}/card/${slugifyFullName(card?.name)}`;
  const backgroundGradient = getGradientFromColor(card?.cardColor);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 px-4 relative overflow-hidden"
      style={{ background: backgroundGradient }}
    >
      <div className="max-w-sm mx-auto relative z-10">
        <DigitalCardPreview
          profile={{ ...card, id: firestoreCardId }}
          actions={card.actions || []}
          onDownloadContact={downloadContactVCF}
          onShareDetails={handleShareDetailsModal}
          cardColor={card.cardColor || "#1a237e"}
          fontColor={card.fontColor || "#ffffff"}
          buttonLabelColor={card.buttonLabelColor || "#ffffff"}
          socialIconColor={card.socialIconColor || "#ffffff"}
          socials={socials}
          style={{
            background: card.cardColor || "#1a237e",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}
        />

        <div className="text-center mt-6">
          <p className="text-white text-sm font-medium opacity-90">
            Powered by SB CARDS
          </p>
        </div>
      </div>

      {/* QR Code Toggle Button - Fixed Bottom Right */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 p-4 rounded-full shadow-2xl hover:bg-opacity-100 hover:scale-110 transition-all duration-300 border border-white border-opacity-50"
          title="Show QR Code"
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 11v8h8v-8H3zm2 2h4v4H5v-4zm8-10v8h8V3h-8zm2 2h4v4h-4V5zM3 3v8h8V3H3zm2 2h4v4H5V5zm8 8h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2zm2-4h2v2h-2v-2zm0 2h2v2h-2v-2z"/>
          </svg>
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Share This Card</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <QRCodeCanvas
                    value={currentUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mb-6 font-medium">
                Scan to view <span className="font-bold">{card.name}</span>'s card
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl).then(() => {
                      alert("Link copied to clipboard!");
                    }).catch(() => {
                      const textArea = document.createElement("textarea");
                      textArea.value = currentUrl;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert("Link copied to clipboard!");
                    });
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition font-semibold"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `${card.name} - Digital Business Card`,
                          text: "Check out my digital business card!",
                          url: currentUrl,
                        });
                      } catch (err) {
                        navigator.clipboard.writeText(currentUrl);
                        alert("Link copied to clipboard!");
                      }
                    } else {
                      navigator.clipboard.writeText(currentUrl);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition font-semibold"
                >
                  📱 Share Card
                </button>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 break-all">
                  {currentUrl}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PublicCardView;
