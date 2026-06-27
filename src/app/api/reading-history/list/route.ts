import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser;
    
    // Check auth
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to access reading history'
      }, { status: 401 });
    }
    
    // Get URL params
    const url = new URL(request.url);
    const limitCount = parseInt(url.searchParams.get('limit') || '50');
    
    // Get reading history collection
    const historyRef = collection(db, `users/${user.uid}/reading_history`);
    const q = query(
      historyRef,
      orderBy('lastRead', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const historyItems = querySnapshot.docs.map(doc => doc.data());
    
    return NextResponse.json({
      success: true,
      data: historyItems,
      count: historyItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching reading history:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch reading history',
      details: error.stack
    }, { status: 500 });
  }
} 
