import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUser, verifyToken, verifyUser } from "@/lib/db";
import bcrypt from "bcryptjs";

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
    
    // Verify the token and get the user ID
    const userId = verifyToken(token);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const { current_password, new_password } = await req.json();
    
    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    // Get the user
    const user = findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update the user's password
    updateUser(userId, { password: hashedPassword });
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err: any) {
    console.error('Password change error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 