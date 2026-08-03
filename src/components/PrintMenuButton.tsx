'use client';

import { useState } from 'react';

export default function PrintMenuButton() {
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPNG() {
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('printable-menu');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'menu-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3 print:hidden">
      <button
        onClick={handlePrint}
        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        🖨️ Print as PDF
      </button>
      <button
        onClick={handleDownloadPNG}
        disabled={loading}
        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? 'Generating...' : '📥 Download PNG'}
      </button>
      <button
        onClick={() => window.history.back()}
        className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
      >
        ← Back
      </button>
    </div>
  );
}