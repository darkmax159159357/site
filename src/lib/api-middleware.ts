import { NextRequest, NextResponse } from 'next/server';
import { auth } from './firebase';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// A helper function to extract the auth token from the request
export const extractToken = (req: NextRequest | Request) => {
  // Try to get from headers first
  const authHeader = req.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get from cookies if no header
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  return token;
};

// Use this for Next.js API routes to ensure authentication
export async function withAuth(
  req: NextRequest | Request,
  handler: (req: NextRequest | Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractToken(req);
  
  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is missing. Please sign in.'
    }, { status: 401 });
  }
  
  try {
    // Try to use the token (in client components)
    if (!auth.currentUser) {
      // We need to log in with the token
      const userCredential = await signInWithCustomToken(auth, token);
      
      if (!userCredential.user) {
        throw new Error('Failed to authenticate with token');
      }
      
      console.log('API authenticated with token:', userCredential.user.uid);
    }
    
    // Authentication succeeded, call the handler
    return handler(req);
  } catch (error: any) {
    console.error('API authentication error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.',
      details: error.message
    }, { status: 401 });
  }
} 