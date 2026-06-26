import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');

// Debug function to log paths
const logPaths = (requestedPath: string, fullPath: string) => {
  console.log("Static File Request Debug:");
  console.log("Current working directory:", process.cwd());
  console.log("MEDUSA_PATH:", MEDUSA_PATH);
  console.log("Requested path:", requestedPath);
  console.log("Full resolved path:", fullPath);
  console.log("File exists:", fs.existsSync(fullPath));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Ensure the requested path is within Medusa directory
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }
    
    // Construct the full path
    const fullPath = path.join(MEDUSA_PATH, normalizedPath);
    
    // Log paths for debugging
    logPaths(filePath, fullPath);
    
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }
    
    // Create response with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      }
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    );
  }
} 