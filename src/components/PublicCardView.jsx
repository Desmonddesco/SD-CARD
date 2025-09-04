import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { QRCodeCanvas } from "qrcode.react";
import DigitalCardPreview from "./DigitalCardPreview";

// Beautiful blue-toned gradient combinations
const gradientBackgrounds = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple-Blue
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Light Blue-Cyan
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green-Turquoise
  "linear-gradient(135deg, #5f72bd 0%, #9b59b6 100%)", // Deep Blue-Purple
  "linear-gradient(135deg, #3498db 0%, #2980b9 100%)", // Classic Blue
  "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)", // Light-Dark Blue
  "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", // Sky Blue-Ocean Blue
  "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", // Navy Blue
  "linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)", // Purple-Teal
  "linear-gradient(135deg, #70e1f5 0%, #ffd194 100%)"  // Light Blue-Soft Yellow
];

// Function to get gradient based on card color
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

function PublicCardView() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      if (!cardId) {
        setError("Card ID not provided");
        setLoading(false);
        return;
      }

      try {
        const cardDoc = await getDoc(doc(db, "cards", cardId));
        if (cardDoc.exists()) {
          const cardData = cardDoc.data();
          
          // Map socials from actions to top-level fields
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
        } else {
          setError("Card not found");
        }
      } catch (err) {
        console.error("Error fetching card:", err);
        setError("Failed to load card");
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
    linkedin: card.linkedin,
    email: card.email,
    whatsapp: card.whatsapp,
    youtube: card.youtube,
    website: card.website
  };

  const currentUrl = `${window.location.origin}/card/${cardId}`;
  const backgroundGradient = getGradientFromColor(card.cardColor);

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-8 px-4 relative overflow-hidden"
      style={{ background: backgroundGradient }}
    >
      <div className="max-w-sm mx-auto relative z-10">
        <DigitalCardPreview
          profile={card}
          actions={card.actions || []}
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
        
        {/* Floating text below card */}
        <div className="text-center mt-6">
          <p className="text-white text-sm font-medium opacity-90">
            Powered by SB CARDS
          </p>
        </div>
      </div>
      
      {/* QR Code Toggle Button - Fixed Bottom Right - Always Visible */}
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

      {/* QR Code Modal - Enhanced */}
      {showQR && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          />
          
          {/* QR Code Modal */}
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
              
              {/* URL Display */}
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
