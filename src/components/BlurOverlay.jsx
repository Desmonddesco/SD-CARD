// BlurOverlay.js
import React from "react";

export default function BlurOverlay({ show, children, onUpgradeClick }) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-20">
          <div className="text-lg font-bold mb-3 text-black">Upgrade to Premium</div>
          <button
            className="bg-black text-white px-5 py-2 rounded-full font-semibold shadow-md"
            onClick={onUpgradeClick}
          >
            Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}
