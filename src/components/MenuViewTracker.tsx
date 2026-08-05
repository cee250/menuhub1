'use client';

import { useEffect } from 'react';

export default function MenuViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, eventType: 'menu_view' }),
    }).catch((err) => console.log('Analytics tracking failed:', err));
  }, [slug]);

  return null;
}