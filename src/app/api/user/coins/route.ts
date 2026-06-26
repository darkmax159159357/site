import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUser, verifyToken } from "@/lib/db";

// GET endpoint to retrieve user's coins
export async function GET(req: NextRequest) {
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
    
    // Get the user
    const user = findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      coins: user.coins || 0
    });
  } catch (err: any) {
    console.error('Error retrieving coins:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST endpoint to update user's coins
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
    const body = await req.json();
    const { action, amount } = body;
    
    if (!action || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request. Action and valid amount required.' },
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
    
    // Current coins
    const currentCoins = user.coins || 0;
    let newCoins: number;
    
    // Update coins based on action
    if (action === 'add') {
      newCoins = currentCoins + amount;
    } else if (action === 'subtract') {
      if (currentCoins < amount) {
        return NextResponse.json(
          { success: false, message: 'Insufficient coins' },
          { status: 400 }
        );
      }
      newCoins = currentCoins - amount;
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "add" or "subtract".' },
        { status: 400 }
      );
    }
    
    // Update the user
    const updatedUser = updateUser(userId, { coins: newCoins });
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to update coins' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Coins ${action === 'add' ? 'added' : 'subtracted'} successfully`,
      coins: newCoins
    });
  } catch (err: any) {
    console.error('Error updating coins:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 