'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeDownload({ slug, businessName, logoUrl, themeColor }: { slug: string, businessName?: string, logoUrl?: string, themeColor?: string }) {
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menuhub1.netlify.app';
  const menuUrl = baseUrl + '/menu/' + slug;
  const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(menuUrl);

  const handleDownload = async () => {
    setLoading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas is not supported in this browser.');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = themeColor || '#2563eb';
      ctx.lineWidth = 16;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(businessName || slug, canvas.width / 2, 140);

      const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 640,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });

      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => resolve();
      });

      ctx.drawImage(qrImage, (canvas.width - 640) / 2, 240, 640, 640);

      if (logoUrl) {
        const logoImage = new Image();
        if (logoUrl.startsWith('http')) {
            logoImage.crossOrigin = 'anonymous';
        }
        logoImage.src = logoUrl;
        
        await new Promise<void>((resolve) => {
          logoImage.onload = () => resolve();
          logoImage.onerror = () => {
              console.warn('Logo failed to load for canvas drawing');
              resolve(); 
          };
        });

        if (logoImage.complete && logoImage.naturalWidth > 0) {
          const logoSize = 180;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = 950;
          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
              ctx.roundRect(logoX, logoY, logoSize, logoSize, 24);
          } else {
              ctx.rect(logoX, logoY, logoSize, logoSize);
          }
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.clip();
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
          ctx.restore();
        }
      }

      ctx.fillStyle = '#4b5563';
      ctx.font = '26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to view our menu', canvas.width / 2, 1220);

      // 🚀 DRAW SMALL MENUHUB WATERMARK AT THE VERY BOTTOM (Original layout preserved)
      ctx.font = 'bold 22px Arial';
      const menuWidth = ctx.measureText('Menu').width;
      const hubWidth = ctx.measureText('Hub').width;
      const gap = 4;
      const totalWidth = menuWidth + hubWidth + gap;
      const startX = (canvas.width - totalWidth) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#2563eb'; // Blue
      ctx.fillText('Menu', startX, 1280);
      ctx.fillStyle = '#111827'; // Black
      ctx.fillText('Hub', startX + menuWidth + gap, 1280);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
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
        <span className="text-2xl">📱</span> QR Code Card
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Download a printable card with your logo, name, and QR code. Perfect for table tents!
      </p>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div 
          ref={cardRef}
          className="w-72 bg-white border-4 rounded-2xl p-8 shadow-2xl"
          style={{ borderColor: themeColor || '#2563eb' }}
        >
          <div className="text-center">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-20 h-20 object-contain mx-auto mb-4"
                crossOrigin="anonymous"
              />
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {businessName || slug}
            </h3>
            <img 
              src={qrApiUrl} 
              alt="QR Code" 
              className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-xl"
              crossOrigin="anonymous"
            />
            <p className="text-sm text-gray-500 mt-4 font-medium">
              Scan to view our menu
            </p>
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-gray-500 break-all mb-3 bg-gray-50 p-2 rounded">
            <span className="font-bold">Link:</span> {menuUrl}
          </p>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm font-medium disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md w-full sm:w-auto"
          >
            {loading ? '⏳ Generating...' : '⬇️ Download QR Card'}
          </button>
        </div>
      </div>
    </div>
  );
}