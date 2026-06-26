export interface SiteSettings {
  homesocialbuttons: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  homesocialbuttons: false
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    // Fetch settings from API endpoint
    const response = await fetch('/api/site-settings');
    if (!response.ok) {
      throw new Error(`Failed to fetch site settings: ${response.status}`);
    }
    
    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error("Error loading site settings:", error);
    return DEFAULT_SITE_SETTINGS;
  }
} 