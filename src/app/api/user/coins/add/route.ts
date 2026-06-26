import { db } from '@/lib/firebase';
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import admin from '@/lib/firebase-admin';

// Needs Firebase Admin at runtime; don't pre-render at build time.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get token from header
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get user data from Firestore to check role
    const userDoc = await getDoc(doc(db, 'users', decodedToken.uid));
    const userData = userDoc.data();
    
    // Check if user is admin
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { userId, amount } = body;
    
    if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Check if target user exists
    const targetUserDoc = await getDoc(doc(db, 'users', userId));
    if (!targetUserDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Add coins to user account
    await updateDoc(doc(db, 'users', userId), {
      coins: increment(amount)
    });
    
    // Get updated user data
    const updatedUserDoc = await getDoc(doc(db, 'users', userId));
    const updatedUserData = updatedUserDoc.data();
    
    return NextResponse.json({
      success: true,
      message: `Added ${amount} coins to user account`,
      currentCoins: updatedUserData?.coins || 0
    });
  } catch (error) {
    console.error("Error adding coins:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 