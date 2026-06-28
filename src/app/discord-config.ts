// Discord OAuth2 Configuration (client-safe values only)
// CLIENT_ID is a public value; the redirect URI is derived from the site URL.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://glintscans.com').replace(/\/$/, '');

export const DISCORD_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1386945614885163192',
  REDIRECT_URI: `${SITE_URL}/api/auth/discord/callback`,
}; 