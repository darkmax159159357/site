import { getAdConfig } from '@/lib/firebaseAds';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adConfig = await getAdConfig();
    
    // If adsTxt content is available, return it as plain text
    if (adConfig.adsTxt) {
      return new NextResponse(adConfig.adsTxt, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }
    
    // If no ads.txt content, return a 404
    return new NextResponse('Not found', { status: 404 });
  } catch (error) {
    console.error('Error serving ads.txt:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 