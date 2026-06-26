import { NextRequest, NextResponse } from "next/server";
import { removeToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Remove the token
    removeToken(token);
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 