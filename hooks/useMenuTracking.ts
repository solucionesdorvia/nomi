'use client'

import { useEffect } from 'react'

export function useMenuTracking(slug: string) {
  useEffect(() => {
    const device = typeof window !== 'undefined'
      ? (window.innerWidth < 768 ? 'mobile' : 'desktop')
      : undefined

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event: 'menu_view', device }),
    }).catch(() => {})
  }, [slug])

  function trackItem(itemId: string, event: 'item_view' | 'item_click' = 'item_view') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event, itemId }),
    }).catch(() => {})
  }

  return { trackItem }
}
