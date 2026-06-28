/**
 * Environment configuration helper
 * Always using production settings for consistency
 */

// Always return true for production mode
export const isProduction = (): boolean => {
  return true;
};

// Base URL helper — env-driven so the same build works on localhost, a staging
// host, and production. Set NEXT_PUBLIC_SITE_URL per environment.
export const getBaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://glintscans.com').replace(/\/$/, '');
};

// Helper to ensure HTTPS URLs
export const ensureHttps = (url: string): string => {
  // If the URL already starts with https://, return it as is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If the URL starts with http://, replace the protocol
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If it's a relative URL, prepend the base URL
  return `${getBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default {
  isProduction,
  getBaseUrl,
  ensureHttps
}; 