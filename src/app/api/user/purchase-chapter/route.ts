import { auth, db } from '@/lib/firebase';
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { chapterId, coinAmount = 1 } = body;
    
    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }
    
    // Get user data to check coins
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const userCoins = userData?.coins || 0;
    
    // Check if user has enough coins
    if (userCoins < coinAmount) {
      return NextResponse.json({ 
        error: 'Not enough coins', 
        required: coinAmount,
        available: userCoins 
      }, { status: 400 });
    }
    
    // Check if user already purchased this chapter
    if (userData?.purchasedChapters?.includes(chapterId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Chapter already purchased',
        alreadyPurchased: true
      });
    }
    
    // Update user document: decrement coins and add chapter to purchased list
    await updateDoc(userDocRef, {
      coins: increment(-coinAmount),
      purchasedChapters: arrayUnion(chapterId)
    });
    
    // Get updated user data
    const updatedUserDoc = await getDoc(userDocRef);
    const updatedUserData = updatedUserDoc.data();
    
    return NextResponse.json({
      success: true,
      message: 'Chapter purchased successfully',
      coinsRemaining: updatedUserData?.coins || 0,
      coinsSpent: coinAmount
    });
  } catch (error) {
    console.error("Error purchasing chapter:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 