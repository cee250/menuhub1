'use client';

interface Props {
  whatsappNumber: string;
  waiterCallNumber?: string | null;
  businessName: string;
  themeColor?: string | null;
}

export default function WhatsAppOrderButton({ 
  whatsappNumber, 
  waiterCallNumber,
  businessName, 
  themeColor 
}: Props) {
  // Clean numbers - remove all non-digits
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '');
  const cleanWaiter = waiterCallNumber ? waiterCallNumber.replace(/\D/g, '') : '';
  
  const handleOrder = () => {
    const message = 'Hello ' + businessName + '! I would like to place an order.';
    const url = 'https://wa.me/' + cleanWhatsApp + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (cleanWaiter) {
      // Use tel: with just the number, no extra + sign
      const url = 'tel:' + cleanWaiter;
      window.location.href = url;
    } else {
      alert('Waiter call number not set. Please contact the restaurant directly.');
    }
  };

  const bgColor = themeColor || '#2563eb';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 shadow-2xl z-[9999]">
      <div className="max-w-4xl mx-auto p-3 flex gap-3">
        <button
          type="button"
          onClick={handleOrder}
          className="flex-1 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-base"
          style={{ backgroundColor: bgColor }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Order Now
        </button>

        {cleanWaiter && (
          <button
            type="button"
            onClick={handleCall}
            className="flex-1 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-base"
            style={{ backgroundColor: bgColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
            Call Waiter
          </button>
        )}
      </div>
    </div>
  );
}