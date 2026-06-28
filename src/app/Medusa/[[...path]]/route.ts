import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { promises as fs } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from the URL
    const relativePath = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
    
    // Security: Check if this is a directory access attempt (no file extension)
    if (relativePath === '' || !relativePath.includes('.')) {
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Security: Block JSON files to prevent metadata leakage
    if (relativePath.endsWith('.json')) {
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    // Security: Check referrer to prevent direct access
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // Only allow requests from our own domain or missing referrer for legit image requests
    const isValidReferer = !referer || 
                          referer.includes(host || '') || 
                          referer.includes('glintscans.com');
    
    if (!isValidReferer) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    // Resolve the full path to the file within the Medusa directory
    const filePath = path.join(process.cwd(), 'Medusa', relativePath);

    console.log('Serving file from path:', filePath);
    
    // Check if the file exists
    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
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
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 