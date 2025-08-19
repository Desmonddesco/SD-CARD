import React from "react";
import DigitalCardPreview from "./DigitalCardPreview";

function CardThumbnail({ card }) {
  // constants should match original DigitalCardPreview size
  const CARD_WIDTH = 320;
  const CARD_HEIGHT = 510; // adjust to your default card height
  const SCALE = 0.31;

  return (
    <div
      className="relative w-full flex justify-center items-start overflow-hidden rounded-xl"
      style={{
        height: `${CARD_HEIGHT * SCALE}px`, // ensure this matches the visible area
        background: "#f9f9f9",
      }}
    >
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: `scale(${SCALE})`,
          transformOrigin: "top center", // keep top visible ALWAYS
          pointerEvents: "none",
        }}
      >
        <DigitalCardPreview
          profile={card}
          actions={[]}  // Hide actions in thumbnail
          cardColor={card.cardColor}
          fontColor={card.fontColor}
          buttonLabelColor={card.buttonLabelColor}
          socials={{
            linkedin: card.linkedin,
            email: card.email,
            whatsapp: card.whatsapp,
            youtube: card.youtube
          }}
        />
      </div>
    </div>
  );
}

export default CardThumbnail;
