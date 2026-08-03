'use client';

import { useState, useRef } from 'react';

export default function QRCodeLayoutEditor({ slug, businessName, logoUrl, themeColor }: { slug: string, businessName?: string, logoUrl?: string, themeColor?: string }) {
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [borderColor, setBorderColor] = useState(themeColor || '#2563eb');
  const [tagline, setTagline] = useState('Scan to view our menu');
  const [borderWidth, setBorderWidth] = useState(4);
  const [logoSize, setLogoSize] = useState(80);
  const [qrSize, setQrSize] = useState(192);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menuhub1.netlify.app';
  const menuUrl = baseUrl + '/menu/' + slug;
  const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(menuUrl);

  const handleDownload = async () => {
    setLoading(true);

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      if (!cardRef.current) {
        throw new Error('Card element not found');
      }

      // 🚀 FORCE IMAGES TO LOAD BEFORE CAPTURING
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { 
            img.onload = resolve; 
            img.onerror = resolve; 
          });
      }));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: bgColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'menuhub-qr-' + slug + '.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-8 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
        <span className="text-2xl">🎨</span> QR Code Layout Editor
      </h2>
      <p className="text-sm text-gray-600 mb-4">Customize how your QR code card looks when printed.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-12 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-12 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
            <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="h-12 w-full rounded-lg border border-gray-300 cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Border Width: {borderWidth}px</label>
            <input type="range" min="0" max="10" value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline Text</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g., Scan to view our menu" className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Size: {logoSize}px</label>
            <input type="range" min="32" max="128" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Size: {qrSize}px</label>
            <input type="range" min="120" max="240" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} className="w-full" />
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md"
          >
            {loading ? ' Generating...' : '⬇️ Download Custom QR Card'}
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center">
          <div 
            ref={cardRef}
            className="w-72 p-8 rounded-2xl shadow-2xl text-center"
            style={{ 
              backgroundColor: bgColor,
              border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
              color: textColor
            }}
          >
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                crossOrigin="anonymous"
                className="mx-auto mb-4 object-contain"
                style={{ width: logoSize + 'px', height: logoSize + 'px' }}
              />
            )}
            <h3 className="text-2xl font-bold mb-4" style={{ color: textColor }}>
              {businessName || slug}
            </h3>
            <img 
              src={qrApiUrl} 
              alt="QR Code" 
              crossOrigin="anonymous"
              className="mx-auto border-2 border-gray-200 rounded-xl"
              style={{ width: qrSize + 'px', height: qrSize + 'px' }}
            />
            <p className="text-sm mt-4 font-medium" style={{ color: textColor }}>
              {tagline}
            </p>

            {/*  SMALL MENUHUB WATERMARK AT THE VERY BOTTOM (Original layout preserved) */}
            <div className="mt-6 flex justify-center items-center gap-0.5 opacity-60">
              <span className="text-[10px] font-bold text-blue-600">Menu</span>
              <span className="text-[10px] font-bold text-gray-900">Hub</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}