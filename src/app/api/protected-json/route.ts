import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get the path from query parameters
    const { searchParams } = new URL(request.url);
    const jsonPath = searchParams.get('path') || '';
    
    // Add your authentication logic here
    const isAuthenticated = await checkUserAuthentication(request);
    
    if (!isAuthenticated) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required to access JSON data'
      }, { status: 401 });
    }
    
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'Medusa', jsonPath);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      return NextResponse.json(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (error) {
      console.error('JSON file not found:', filePath);
      return NextResponse.json({
        error: 'Not Found',
        message: 'JSON file not found'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error serving protected JSON:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to load JSON data'
    }, { status: 500 });
  }
}

// Helper function to check user authentication
async function checkUserAuthentication(req: NextRequest): Promise<boolean> {
  // TODO: Implement your authentication logic here
  // For development, we'll allow access
  return true;
} 