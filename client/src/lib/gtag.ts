/**
 * Google Tag (gtag) utility for consent-aware analytics tracking
 * 
 * This module provides utilities to initialize and manage Google Tag Manager
 * based on user cookie consent preferences. It respects GDPR/privacy requirements
 * by only loading tracking scripts when users have explicitly consented.
 */

/**
 * Trigger Google Tag initialization manually
 * This is called when user accepts cookies to immediately initialize tracking
 * without waiting for page reload
 */
export function triggerGtagInit(): void {
  // Dispatch a custom event that the gtag loader in index.html listens for
  const event = new CustomEvent('cookie-consent-changed');
  window.dispatchEvent(event);
  
  // Also dispatch storage event for cross-tab synchronization
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'cookie-preferences',
    newValue: localStorage.getItem('cookie-preferences'),
    url: window.location.href
  }));
}

/**
 * Check if user has consented to analytics/targeting cookies
 */
export function hasAnalyticsConsent(): boolean {
  try {
    const preferences = localStorage.getItem('cookie-preferences');
    if (!preferences) return false;
    
    const parsed = JSON.parse(preferences);
    return parsed.targeting === true || parsed.analytics === true;
  } catch (e) {
    console.error('[gtag] Error checking consent:', e);
    return false;
  }
}

/**
 * Global gtag function for tracking events
 * Safe to call even if gtag hasn't loaded yet (uses dataLayer)
 */
export function gtag(...args: any[]): void {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
}

/**
 * Track a custom conversion event
 */
export function trackConversion(eventName: string, params?: Record<string, any>): void {
  if (!hasAnalyticsConsent()) {
    console.log('[gtag] Conversion tracking skipped - no consent');
    return;
  }
  
  gtag('event', eventName, params);
}

// TypeScript declarations for window.dataLayer and window.gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
