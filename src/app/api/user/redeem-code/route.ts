import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import firebaseApp from '@/lib/firebase';

const db = getFirestore(firebaseApp as FirebaseApp);

export async function POST(request: NextRequest) {
  try {
    // Get the redemption code from request body
    const body = await request.json();
    const { code, uid } = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to redeem codes.' },
        { status: 401 }
      );
    }
    
    if (!code) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      );
    }
    
    try {
      // Get user document using UID
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return NextResponse.json(
          { error: 'User not found.' },
          { status: 404 }
        );
      }
      
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Find the code document using a query
      const codesQuery = query(collection(db, 'redemption_codes'), where('code', '==', code));
      const codeSnapshot = await getDocs(codesQuery);
      
      if (codeSnapshot.empty) {
        return NextResponse.json(
          { error: 'Invalid redemption code' },
          { status: 400 }
        );
      }
      
      // Get the first matching code document
      const codeDoc = codeSnapshot.docs[0];
      const codeData = codeDoc.data();
      const codeRef = codeDoc.ref;

        // Check if packageId is valid (must be 1, 2, 3, or 4)
            if (!codeData.packageId || ![1, 2, 3, 4].includes(Number(codeData.packageId))) {
              return NextResponse.json(
                { error: 'Invalid redemption code. Please enter a proper code.' },
                { status: 400 }
              );
            }
      
      // Check if code is already redeemed
      if (codeData.isRedeemed === true) {
        return NextResponse.json(
          { error: 'This code has already been redeemed' },
          { status: 400 }
        );
      }
      
      // Check if code has expired
      const expirationDate = codeData.expiresAt?.toDate?.() || new Date(codeData.expiresAt);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'This code has expired' },
          { status: 400 }
        );
      }
      
      // Update using a transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        // Calculate new coin balance
        const currentCoins = userData.coins || 0;
        const coinsToAdd = codeData.coins || 0;
        const newBalance = currentCoins + coinsToAdd;
        
        // Update user's coin balance
        transaction.update(userRef, { coins: newBalance });
        
        // Mark code as redeemed
        transaction.update(codeRef, { 
          isRedeemed: true, 
          redeemedBy: userEmail,
          redeemedAt: new Date() 
        });
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Code successfully redeemed',
        newBalance: userData.coins + codeData.coins,
        coinsAdded: codeData.coins
      });
      
    } catch (error: any) {
      console.error('Error redeeming code:', error);
      
      return NextResponse.json(
        { error: error.message || 'Failed to redeem code' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in redeem-code API route:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 