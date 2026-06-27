import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { promises as fs } from 'fs';
import path from 'path';
import { stat } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const manga = searchParams.get('manga');
    const chapter = searchParams.get('chapter');
    const page = searchParams.get('page');
    const file = searchParams.get('file');
    const imagePath = searchParams.get('path');
    
    // Add your authentication logic here
    const isAuthenticated = await checkUserAuthentication(request);
    
    if (!isAuthenticated) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required to access images'
      }, { status: 401 });
    }
    
    // If accessing a specific chapter, check if it's locked
    if ((manga && chapter) || (imagePath && imagePath.includes('chapter-'))) {
      // Extract manga ID and chapter number if they're in the path
      let mangaId = manga;
      let chapterNum = chapter;
      
      if (!mangaId && imagePath) {
        // Try to extract manga ID from path
        const pathParts = imagePath.split('/');
        if (pathParts.length > 0) {
          mangaId = pathParts[0];
        }
      }
      
      if (!chapterNum && imagePath) {
        // Try to extract chapter number from path
        const match = imagePath.match(/chapter-(\d+)/);
        if (match && match[1]) {
          chapterNum = match[1];
        }
      }
      
      if (mangaId && chapterNum) {
        const isChapterAccessible = await checkChapterAccess(request, mangaId, chapterNum);
        if (!isChapterAccessible) {
          return NextResponse.json({
            error: 'Premium Content',
            message: 'This chapter requires premium access'
          }, { status: 403 });
        }
      }
    }
    
    // Determine the file path
    let filePath;
    if (manga && chapter && page) {
      // Direct manga chapter access
      filePath = path.join(process.cwd(), 'Medusa', 'manga', manga, `chapter-${chapter}`, page);
    } else if (manga && chapter && file) {
      // Direct chapter file access
      filePath = path.join(process.cwd(), 'Medusa', 'manga', manga, `chapter-${chapter}`, file);
    } else if (imagePath) {
      // Path-based access
      filePath = path.join(process.cwd(), 'Medusa', 'manga', imagePath);
    } else {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Missing required parameters'
      }, { status: 400 });
    }
    
    // Check if the file exists
    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Image not found'
        }, { status: 404 });
      }
    } catch (e) {
      console.error('Image file not found:', filePath);
      return NextResponse.json({
        error: 'Not Found',
        message: 'Image not found'
      }, { status: 404 });
    }
    
    // Read the image file - Using standard fs (not promises) for this part
    const fs_standard = require('fs');
    const fileBuffer = fs_standard.readFileSync(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'image/jpeg';
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.avif':
        contentType = 'image/avif';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }
    
    // Create headers for the response
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    };
    
    // Return a standard Response
    return new Response(fileBuffer, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Error serving protected image:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to load image'
    }, { status: 500 });
  }
}

// Helper function to check user authentication
async function checkUserAuthentication(req: NextRequest): Promise<boolean> {
  // TODO: Implement your authentication logic here
  // For development, we'll allow access
  return true;
}

// Helper function to check chapter access
async function checkChapterAccess(req: NextRequest, mangaId: string, chapterNum: string): Promise<boolean> {
  try {
    // Read manga data to check if chapter is locked
    const mangaDataPath = path.join(process.cwd(), 'Medusa', 'manga', mangaId, 'manga.json');
    
    try {
      const fileContent = await fs.readFile(mangaDataPath, 'utf8');
      const mangaData = JSON.parse(fileContent);
      
      if (!mangaData.chapters) {
        return true; // If no chapters defined, allow access
      }
      
      const chapter = mangaData.chapters.find((ch: any) => 
        ch.number.toString() === chapterNum);
      
      if (!chapter) {
        return false;
      }
      
      // If chapter is not locked, allow access
      if (!chapter.isLocked) {
        return true;
      }
      
      // If chapter is locked, check premium access
      return await checkPremiumAccess(req);
      
    } catch (error) {
      console.error('Error reading manga data for access check:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Error checking chapter access:', error);
    return false;
  }
}

// Helper function to check premium access
async function checkPremiumAccess(req: NextRequest): Promise<boolean> {
  // TODO: Implement your premium access check logic here
  // For development, we'll allow access
  return true;
} 