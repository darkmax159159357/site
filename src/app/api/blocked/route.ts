import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Get the reason from query parameters
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get('reason') || 'unauthorized-access';
  
  // Return a proper error response
  return NextResponse.json({
    error: 'Access Forbidden',
    message: 'Direct access to this resource is not allowed',
    reason: reason,
    timestamp: new Date().toISOString()
  }, { 
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    }
  });
} 
