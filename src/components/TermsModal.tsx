'use client';

import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function TermsModal({ isOpen, onClose, onAgree }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Terms and Regulations</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto text-gray-300 space-y-4 text-sm leading-relaxed">
          <section>
            <h3 className="text-white font-semibold mb-2 text-base">1. Acceptance of Terms</h3>
            <p>By registering for MenuHub, you agree to abide by our terms and conditions. MenuHub provides a digital menu platform for businesses to showcase their products and receive orders via WhatsApp.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 text-base">2. Service Description</h3>
            <p>Our service includes a digital menu, QR code generation, WhatsApp ordering integration, and real-time analytics. The initial setup fee is 30,000 RWF, which includes full system access and 5 professionally printed QR codes. The recurring monthly maintenance fee is 15,000 RWF.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 text-base">3. Business Responsibility</h3>
            <p>Business owners are responsible for the accuracy of their menu items, prices, and images. MenuHub is not responsible for any transactions or communications that occur between the business and its customers via WhatsApp.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 text-base">4. Data Privacy</h3>
            <p>We collect business information (name, contact, location) to provide and improve our services. We do not sell your data to third parties. Your menu data is public for your customers to view.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 text-base">5. Account Activation</h3>
            <p>All new registrations are subject to review by the MenuHub administration. Accounts will be activated once the setup process is verified.</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 text-base">6. Termination</h3>
            <p>MenuHub reserves the right to suspend or terminate accounts that violate these terms or fail to pay the monthly maintenance fees.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAgree}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            I Agree, Continue
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
