import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type SiteConfig = {
  social: {
    discord: string;
    kofi: string;
  };
  images: {
    // Promo "Unlock Premium" character art and the Redeem-page art.
    // Empty/unset => the site uses its built-in SVG fallback.
    heroImage: string;
    redeemImage: string;
  };
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  social: {
    discord: "", // Default value
    kofi: "", // Default value
  },
  images: {
    heroImage: "/Assets/medusa_stand.svg",
    redeemImage: "/Assets/medusa2.svg",
  },
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    // Try to load configuration from Firestore
    const configRef = doc(db, 'site_config', 'main');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      
      // Fix: Check if URLs are already properly formatted (with http/https)
      // and handle both nested and flat structure
      const discordUrl = data.social?.discord || data.discord || DEFAULT_SITE_CONFIG.social.discord;
      const kofiUrl = data.social?.kofi || data.kofi || DEFAULT_SITE_CONFIG.social.kofi;
      
      // Ensure URLs are absolute
      const ensureAbsoluteUrl = (url: string) => {
        if (!url) return "";
        return url.startsWith('http://') || url.startsWith('https://') 
          ? url 
          : `https://${url}`;
      };
      
      return {
        social: {
          discord: ensureAbsoluteUrl(discordUrl),
          kofi: ensureAbsoluteUrl(kofiUrl),
        },
        images: {
          // Use the dashboard-provided image if set, else the built-in fallback.
          heroImage: data.images?.heroImage || data.heroImage || DEFAULT_SITE_CONFIG.images.heroImage,
          redeemImage: data.images?.redeemImage || data.redeemImage || DEFAULT_SITE_CONFIG.images.redeemImage,
        },
      };
    }

    // If config doesn't exist, return defaults
    return DEFAULT_SITE_CONFIG;
  } catch (error) {
    console.error("Error loading site configuration:", error);
    return DEFAULT_SITE_CONFIG;
  }
} 