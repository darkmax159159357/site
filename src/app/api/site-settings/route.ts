import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface SiteSettings {
  homesocialbuttons: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  homesocialbuttons: false
};

export async function GET() {
  try {
    // Path to site_settings.json in the root directory
    const filePath = path.join(process.cwd(), 'site_settings.json');
    
    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const settings = JSON.parse(fileContents) as SiteSettings;
    
    return NextResponse.json({
      ...DEFAULT_SITE_SETTINGS,
      ...settings
    });
  } catch (error) {
    console.error("Error loading site settings:", error);
    return NextResponse.json(DEFAULT_SITE_SETTINGS);
  }
} 