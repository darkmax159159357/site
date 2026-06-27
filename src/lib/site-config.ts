import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Homepage section identifiers (the panels that can be reordered/toggled).
export type SectionId =
  | "hero"
  | "premium"      // BlogPosts "Unlock Premium"
  | "socials"
  | "pinned"       // PinnedCollection -> "Editor's Choice" (featured completed series)
  | "popular"      // TrendingSection -> "Most Popular" (Splide center-focus carousel)
  | "latest"       // LatestComics "Latest Updates"
  | "completed"    // Completed Collection
  | "toprated";    // Trending2 -> "Trending Now" (featured + TOP SERIES medal grid)

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
  // Order of homepage panels (top -> bottom). Dashboard-controlled.
  sectionOrder: SectionId[];
};

// Default order mirrors mythtoons: hero, premium, socials, pinned, latest, completed, popular, toprated.
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "hero", "premium", "socials", "pinned", "latest", "completed", "popular", "toprated",
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  social: {
    discord: "", // Default value
    kofi: "", // Default value
  },
  images: {
    heroImage: "/Assets/medusa_stand.svg",
    redeemImage: "/Assets/medusa2.svg",
  },
  sectionOrder: DEFAULT_SECTION_ORDER,
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
        // Validate stored order: keep only known ids, then append any missing ones
        // so a new section never disappears just because the saved order is old.
        sectionOrder: (() => {
          const stored: string[] = Array.isArray(data.sectionOrder) ? data.sectionOrder : [];
          const valid = stored.filter((s): s is SectionId => DEFAULT_SECTION_ORDER.includes(s as SectionId));
          const missing = DEFAULT_SECTION_ORDER.filter((s) => !valid.includes(s));
          return valid.length ? [...valid, ...missing] : DEFAULT_SECTION_ORDER;
        })(),
      };
    }

    // If config doesn't exist, return defaults
    return DEFAULT_SITE_CONFIG;
  } catch (error) {
    console.error("Error loading site configuration:", error);
    return DEFAULT_SITE_CONFIG;
  }
} 