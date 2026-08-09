'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { 
  QrCode, Zap, MessageCircle, BarChart, 
  Image as LucideImage, Phone, MapPin, Wifi, Moon, Sun, ArrowRight, CircleCheck, Sparkles, CircleHelp,
  ChevronDown, Utensils
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  businessType?: string | null;
  location?: string | null;
  themeColor?: string | null;
  hasFreeWifi?: boolean;
}

interface AnimatedHomepageProps {
  featured: Business[];
  allBusinesses: Business[];
  businessTypeLabels: Record<string, string>;
}

/* ───────── FAQ ACCORDION SUB-COMPONENT ───────── */
function FaqAccordion({ question, answer, isDark }: { question: string; answer: string; isDark: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className={`text-base sm:text-lg font-bold pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className={`px-5 pb-5 text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AnimatedHomepage({ featured, allBusinesses, businessTypeLabels }: AnimatedHomepageProps) {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      
      {/* =========================================
          NAVBAR
      ========================================= */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${isDark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-transform group-hover:scale-105 duration-300 ${isDark ? 'bg-blue-500/20' : 'bg-[#2563eb]/10'}`}>
                <Image 
                  src="/logo.png" 
                  alt="MenuHub" 
                  width={48} 
                  height={48} 
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="text-[#2563eb]">Menu</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Hub</span>
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-5">
              <Link 
                href="#browse-menus" 
                className={`hidden sm:block text-sm font-semibold transition-colors ${isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-[#2563eb]'}`}
              >
                Browse Menus
              </Link>
              <Link 
                href="/login" 
                className={`hidden sm:block text-sm font-semibold transition-colors ${isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-[#2563eb]'}`}
              >
                Login
              </Link>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link 
                href="/register" 
                className="text-xs sm:text-sm font-bold text-white bg-[#2563eb] hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================
          HERO SECTION
      ========================================= */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/restaurant-bg.jpeg"
            alt="Restaurant interior"
            fill
            priority
            className="object-cover scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 px-4 py-2 rounded-full text-xs sm:text-sm text-blue-200 mb-8">
            <Zap className="w-4 h-4" />
            <span>The Future of Digital Menus</span>
          </div>
          
          <h1 className="animate-fade-in-up-delay-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
            Elevate Your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Dining Experience
            </span>
          </h1>
          
          <p className="animate-fade-in-up-delay-2 text-base sm:text-lg text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Turn every table, storefront, and social post into a fast, modern sales channel with a digital menu that drives orders, repeat visits, and happier customers.
          </p>
          
          <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-4 text-sm sm:text-base font-bold rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
            >
              Start Free Today
            </Link>
            <Link 
              href="#browse-menus" 
              className="px-8 py-4 text-sm sm:text-base font-bold rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all hover:scale-105"
            >
              Browse All Menus
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================
          TRUST / CTA SECTION
      ========================================= */}
      <section className={`py-16 sm:py-20 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-3xl border p-8 sm:p-10 shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 mb-4">
              <Sparkles className="w-4 h-4" />
              Built for restaurants, cafés, bars and modern service businesses
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              From first scan to final order, MenuHub helps your business look sharper and sell faster.
            </h2>
            <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Replace paper menus with a polished digital experience that loads instantly, supports WhatsApp ordering, and gives you real-time insight into what customers are viewing and buying.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 font-semibold text-white transition hover:bg-blue-700">
                Create your menu <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold transition ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Open your dashboard
              </Link>
            </div>
          </div>

          <div className={`rounded-3xl border p-8 shadow-sm ${isDark ? 'bg-gradient-to-br from-blue-950/70 to-slate-900 border-blue-900/60' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Instant menu view</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Perfect for tables, delivery links, and social media.</p>
              </div>
            </div>
            <ul className="space-y-3">
              {['No app download needed', 'Scan-friendly QR cards', 'Fast updates across your whole catalog'].map((item) => (
                <li key={item} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <CircleCheck className={`mt-0.5 w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================
          6 FEATURES SECTION
      ========================================= */}
      <section className={`py-16 sm:py-24 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need to <span className="text-[#2563eb]">Scale</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Powerful features designed specifically to grow your restaurant business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: QrCode, title: 'QR Code Menus', description: 'Generate beautiful QR codes for instant digital menus.', color: 'text-blue-600', bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50' },
              { icon: MessageCircle, title: 'WhatsApp Ordering', description: 'Customers order directly via WhatsApp with one click.', color: 'text-green-600', bg: isDark ? 'bg-green-900/30' : 'bg-green-50' },
              { icon: Zap, title: 'Instant Updates', description: 'Change prices and items in real-time from your dashboard.', color: 'text-purple-600', bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50' },
              { icon: BarChart, title: 'Real-Time Analytics', description: 'Track menu views, popular items, and customer engagement instantly.', color: 'text-orange-600', bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50' },
              { icon: LucideImage, title: 'Photo Gallery', description: 'Showcase your food and ambiance with a beautiful image gallery.', color: 'text-pink-600', bg: isDark ? 'bg-pink-900/30' : 'bg-pink-50' },
              { icon: Phone, title: 'Call Waiter Button', description: 'Let customers call staff directly from their table with one tap.', color: 'text-teal-600', bg: isDark ? 'bg-teal-900/30' : 'bg-teal-50' },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className={`group p-8 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          PRICING PLANS SECTION
      ========================================= */}
      <section className={`py-16 sm:py-24 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Simple, Transparent <span className="text-[#2563eb]">Pricing</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Everything you need to modernize your business with no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Setup Plan */}
            <div className={`relative p-8 rounded-3xl border shadow-xl transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800 border-blue-500/30' : 'bg-white border-blue-100'}`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Initial Setup
              </div>
              <div className="mb-6">
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Business Launch</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#2563eb]">30,000</span>
                  <span className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RWF</span>
                </div>
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>One-time setup fee to get you started.</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Full System Access',
                  '5 Professionally Printed QR Codes',
                  'Digital Menu Setup',
                  'WhatsApp Ordering Integration',
                  'Real-Time Dashboard Access',
                  'Staff Training & Support'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CircleCheck className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center py-4 rounded-2xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20">
                Get Started Now
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className={`relative p-8 rounded-3xl border shadow-lg transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="mb-6">
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Maintenance</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#2563eb]">15,000</span>
                  <span className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RWF/mo</span>
                </div>
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Recurring fee starting from the second month.</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited Menu Updates',
                  'Ongoing WhatsApp Support',
                  'Advanced Analytics Tracking',
                  'Cloud Hosting & Maintenance',
                  'New Feature Updates',
                  'Priority Technical Support'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CircleCheck className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`block w-full text-center py-4 rounded-2xl border font-bold transition-all ${isDark ? 'border-gray-700 text-white hover:bg-gray-700' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}>
                Join MenuHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          FAQ SECTION — ACCORDION DROPDOWN
      ========================================= */}
      <section className={`py-16 sm:py-24 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600 mb-4">
              <CircleHelp className="w-4 h-4" />
              FAQ
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Why modern businesses choose MenuHub
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Every feature is designed to help you present your menu beautifully, simplify ordering, and grow revenue without the overhead of a complicated app.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                question: 'How quickly can I launch my digital menu?',
                answer: 'Most businesses are up and running in minutes. You can add your menu items, upload gallery images, and share your QR code the same day.',
              },
              {
                question: 'Does MenuHub work for restaurants and cafés?',
                answer: 'Yes. MenuHub is built for restaurants, cafés, bars, bakeries, hotels, food trucks, and other service businesses that want a modern ordering experience.',
              },
              {
                question: 'Can customers order directly from WhatsApp?',
                answer: 'Absolutely. The built-in WhatsApp ordering flow makes it easy for customers to place orders or ask questions without leaving your menu.',
              },
              {
                question: 'Will my menu stay easy to update?',
                answer: 'Yes. You can update pricing, availability, and specials in real time from a simple dashboard, so your customers always see the latest options.',
              },
              {
                question: 'Do you offer training to our team?',
                answer: 'Yes! We provide comprehensive training and onboarding support for your team. From setting up your digital menu to managing orders and analytics, we guide you every step of the way so your staff can hit the ground running.',
              },
            ].map((faq, index) => (
              <FaqAccordion
                key={index}
                question={faq.question}
                answer={faq.answer}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          FEATURED BUSINESSES (UP TO 6 CARDS)
      ========================================= */}
      {featured.length > 0 && (
        <section className={`py-16 sm:py-24 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Featured Businesses
              </h2>
              <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Discover amazing restaurants already using MenuHub.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featured.slice(0, 6).map((biz: Business) => (
                <Link key={biz.id} href={`/menu/${biz.slug}`}>
                  <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      {biz.logoUrl ? (
                        <Image 
                          src={biz.logoUrl} 
                          alt={biz.name} 
                          width={56} 
                          height={56} 
                          className={`w-14 h-14 object-contain rounded-xl p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: biz.themeColor || '#2563eb' }}
                        >
                          {biz.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{biz.name}</h3>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {businessTypeLabels[biz.businessType || ''] || 'Business'}
                        </span>
                      </div>
                    </div>

                    {biz.location && (
                      <div className={`flex items-center gap-2 text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{biz.location}</span>
                      </div>
                    )}

                    <div className={`flex flex-wrap gap-2 mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      {biz.hasFreeWifi && (
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                          <Wifi className="w-4 h-4" /> Free WiFi
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================
          EXPLORE ALL MENUS — Browse All Businesses
      ========================================= */}
      <section id="browse-menus" className={`py-16 sm:py-24 px-4 sm:px-6 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600 mb-4">
              <Utensils className="w-4 h-4" />
              Browse All Menus
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Explore Every Menu on MenuHub
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Browse our full directory of registered businesses. View their menus, see their locations, and order directly from WhatsApp.
            </p>
          </div>

          {allBusinesses.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl border ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
              <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No businesses registered yet.</p>
              <p className="text-sm mt-1">Be the first to create your digital menu!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {allBusinesses.map((biz: Business) => (
                <Link key={biz.id} href={`/menu/${biz.slug}`}>
                  <div className={`group p-5 rounded-xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {biz.logoUrl ? (
                        <Image 
                          src={biz.logoUrl} 
                          alt={biz.name} 
                          width={44} 
                          height={44} 
                          className={`w-11 h-11 object-contain rounded-lg p-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                        />
                      ) : (
                        <div 
                          className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0"
                          style={{ backgroundColor: biz.themeColor || '#2563eb' }}
                        >
                          {biz.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{biz.name}</h3>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {businessTypeLabels[biz.businessType || ''] || 'Business'}
                        </span>
                      </div>
                    </div>
                    {biz.location && (
                      <div className={`flex items-center gap-1.5 text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{biz.location}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      View Menu <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {allBusinesses.length > 6 && (
            <div className="text-center mt-10">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing all {allBusinesses.length} registered businesses
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className={`py-12 px-4 border-t transition-colors duration-300 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} MenuHub. All rights reserved.
          </p>
        </div>
      </footer>

      {/* =========================================
          WHATSAPP BUTTON
      ========================================= */}
      <a
        href="https://wa.me/250788889077"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle size={28} strokeWidth={1.5} fill="currentColor" className="fill-white/20" />
      </a>



      {/* =========================================
          CUSTOM ANIMATION STYLES
      ========================================= */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in-up-delay-1 { animation: fade-in-up 0.8s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-in-up-delay-2 { animation: fade-in-up 0.8s ease-out 0.4s forwards; opacity: 0; }
        .animate-fade-in-up-delay-3 { animation: fade-in-up 0.8s ease-out 0.6s forwards; opacity: 0; }
        .animate-slow-zoom { animation: slow-zoom 20s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
}
