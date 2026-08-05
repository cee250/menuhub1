'use client';

import { useState, useEffect } from 'react';
import { BarChart, Calendar, TrendingUp, Award, MessageSquare, Clock, Smartphone, Monitor } from 'lucide-react';

export default function AnalyticsPanel({ businessSlug }: { businessSlug: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const res = await fetch('/api/analytics?slug=' + businessSlug);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [businessSlug]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md mt-8 border border-gray-100 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-full mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Today', value: stats.todayViews || 0, color: 'bg-blue-500', icon: <Calendar size={20} /> },
    { label: 'Week', value: stats.weekViews || 0, color: 'bg-green-500', icon: <BarChart size={20} /> },
    { label: 'Month', value: stats.monthViews || 0, color: 'bg-purple-500', icon: <TrendingUp size={20} /> },
    { label: 'Total Views', value: stats.totalViews || 0, color: 'bg-orange-500', icon: <Award size={20} /> },
    { label: 'Orders Initiated', value: stats.whatsappClicks || 0, color: 'bg-emerald-600', icon: <MessageSquare size={20} /> },
  ];

  // Safety check for renamed property
  const recentEvents = stats.recentEvents || stats.recentViews || [];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg mt-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <BarChart size={20} />
          </span>
          Advanced Analytics
        </h2>
        <button 
          onClick={fetchStats}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-8 h-8 ${card.color} text-white rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
              {card.icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{card.value.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {recentEvents.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} />
            Recent Activity Log
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {recentEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${event.eventType === 'whatsapp_order_click' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {event.eventType === 'whatsapp_order_click' ? 'WhatsApp Order Click' : 'Menu View'}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(event.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  {event.userAgent?.includes('Mobile') ? <Smartphone size={12} /> : <Monitor size={12} />}
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {event.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
