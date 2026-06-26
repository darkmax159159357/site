import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

// Don't evaluate this route at build time — it needs Firebase Admin credentials
// that only exist at runtime (Vercel env vars).
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { discordId, email, username } = await request.json();
    
    if (!discordId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if user with this Discord ID already exists
    const userRecord = await admin.auth()
      .getUserByEmail(email)
      .catch(() => null);
    
    let uid;
    
    if (userRecord) {
      // Update existing user
      uid = userRecord.uid;
    } else {
      // Create a new user
      const newUser = await admin.auth().createUser({
        email,
        displayName: username,
        emailVerified: true,
      });
      
      uid = newUser.uid;
    }
    
    // Set custom claims to identify Discord users
    await admin.auth().setCustomUserClaims(uid, {
      discordId,
      provider: 'discord',
    });
    
    // Generate a custom token for this user
    const customToken = await admin.auth().createCustomToken(uid);
    
    return NextResponse.json({ customToken });
    
  } catch (error) {
    console.error('Error creating custom token:', error);
    return NextResponse.json(
      { error: 'Failed to create authentication token' },
      { status: 500 }
    );
  }
} 