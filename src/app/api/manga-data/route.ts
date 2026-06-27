import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { promises as fs } from 'fs';
import path from 'path';

// Define chapter type
interface Chapter {
  number: number | string;
  isLocked?: boolean;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get the manga path from query parameters
    const { searchParams } = new URL(request.url);
    const mangaPath = searchParams.get('path') || '';
    
    // Add your authentication logic here
    const isAuthenticated = await checkUserAuthentication(request);
    
    if (!isAuthenticated) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required to access manga data'
      }, { status: 401 });
    }
    
    // Read the manga.json file
    const filePath = path.join(process.cwd(), 'Medusa', 'manga', mangaPath, 'manga.json');
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const mangaData = JSON.parse(fileContent);
      
      // Filter out locked chapters if user doesn't have premium access
      const hasPremiumAccess = await checkPremiumAccess(request);
      
      if (!hasPremiumAccess && mangaData.chapters) {
        mangaData.chapters = mangaData.chapters.filter((chapter: Chapter) => !chapter.isLocked);
      }
      
      return NextResponse.json(mangaData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      console.error('Error reading manga data:', error);
      return NextResponse.json({
        error: 'Not Found',
        message: 'Manga data not found'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error serving manga data:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to load manga data'
    }, { status: 500 });
  }
}

// Helper function to check user authentication
async function checkUserAuthentication(req: NextRequest): Promise<boolean> {
  // Implement your authentication logic here
  // Check JWT token, session, etc.
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  
  try {
    // Verify JWT token or session
    // For now, we'll return false to block all access until you implement proper auth
    return false;
    
    // Example of JWT implementation:
    // const token = authHeader.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded ? true : false;
  } catch (error) {
    return false;
  }
}

// Helper function to check premium access
async function checkPremiumAccess(req: NextRequest): Promise<boolean> {
  // Implement your premium access logic here
  // Check if user has premium subscription
  
  try {
    // Check user's premium status from database
    // For now, we'll return false to block premium content until you implement proper checks
    return false;
    
    // Example implementation:
    // const user = await getUserFromRequest(req);
    // return user.isPremium;
  } catch (error) {
    return false;
  }
} 