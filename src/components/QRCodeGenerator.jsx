import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FaDownload, FaShare, FaCopy } from "react-icons/fa";
import Swal from "sweetalert2";

export default function QRCodeGenerator({ 
  url, 
  size = 200, 
  title = "Scan to view card",
  cardName = "Digital Card",
  disabled = false  // Add disabled prop
}) {
  const qrRef = useRef();

  const downloadQR = () => {
    if (disabled) return;
    
    const canvas = qrRef.current.querySelector("canvas");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${cardName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const shareQR = async () => {
    if (disabled) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardName} - Digital Business Card`,
          text: "Check out my digital business card!",
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (disabled) return;
    
    navigator.clipboard.writeText(url).then(() => {
      Swal.fire({
        icon: "success",
        title: "Link Copied!",
        text: "The card link has been copied to your clipboard.",
        timer: 2000,
        showConfirmButton: false
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Swal.fire({
        icon: "success",
        title: "Link Copied!",
        text: "The card link has been copied to your clipboard.",
        timer: 2000,
        showConfirmButton: false
      });
    });
  };

  return (
    <div className={`flex flex-col items-center p-6 bg-white rounded-lg shadow-lg border ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      
      <div ref={qrRef} className="mb-4 p-2 bg-white rounded border">
        <QRCodeCanvas
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={true}
        />
      </div>
      
      <div className="text-xs text-gray-600 mb-4 text-center break-all max-w-full px-2">
        {url}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={downloadQR}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <FaDownload /> Download QR
        </button>
        
        <button
          onClick={shareQR}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <FaShare /> Share
        </button>

        <button
          onClick={copyToClipboard}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
            disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <FaCopy /> Copy Link
        </button>
      </div>
    </div>
  );
}
