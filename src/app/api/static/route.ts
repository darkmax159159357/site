import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Security: Check referrer to prevent direct access
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // Only allow requests from our own domain or missing referrer for legit image requests
    // This helps prevent hotlinking and direct access
    const isValidReferer = !referer || 
                          referer.includes(host || '') || 
                          referer.includes('medusascans.org');
    
    if (!isValidReferer) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    // Get the path query parameter
    const { searchParams } = new URL(request.url);
    let relativePath = searchParams.get('path') || '';
    
    console.log('Static API request for:', relativePath);
    
    // Remove leading slash if present
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    
    // Handle manga paths specifically
    if (relativePath.startsWith('manga/')) {
      // For paths like "manga/blue-star/cover.jpg", keep "manga/" in the path
      // This matches the structure in the Medusa directory
    } else if (relativePath.startsWith('Medusa/')) {
      // For paths with Medusa prefix, remove it since we'll add it back below
      relativePath = relativePath.substring(7);
    }
    
    // Security: Block access to JSON files from direct API calls
    // EXCEPT the public manga catalog (manga.json), which the homepage
    // components (Trending/Top Rated/Most Popular) need to fetch directly.
    if (relativePath.endsWith('.json') && !relativePath.endsWith('manga/manga.json')) {
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Resolve the full path to the file within the Medusa directory
    const filePath = path.join(process.cwd(), 'Medusa', relativePath);
    
    console.log('Static file API - Serving file from path:', filePath);
    
    // Check if the file exists
    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        console.error('Not a file:', filePath);
        return new NextResponse('Not a file', { status: 404 });
      }
    } catch (e) {
      console.error('File not found:', filePath);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Determine MIME type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default content type
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.json') contentType = 'application/json';
    
    // Read and return the file
    const fileBuffer = await fs.readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'X-Content-Type-Options': 'nosniff', // Security: Prevent MIME type sniffing
        'Content-Disposition': 'inline', // Encourage browser to display rather than download
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 