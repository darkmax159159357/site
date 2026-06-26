import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { headers } from 'next/headers';

// Discord credentials come from environment variables (server-only secret).
const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://medusascans.org').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  // Get authorization code from the URL query params
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/auth/sign-in?error=no_code`
    );
  }
  
  try {
    // Exchange code for Discord access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${SITE_URL}/api/auth/discord/callback`,
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Discord token error:', error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/auth/sign-in?error=token_error`
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user data from Discord API
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      console.error('Discord user data error');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/auth/sign-in?error=user_data_error`
      );
    }
    
    const userData = await userResponse.json();
    
    // Generate a custom token on your secure backend
    // This requires using Firebase Admin SDK, which we'll need to handle securely on the server
    // For demonstration purposes, we're showing the flow but can't implement the full functionality
    // without properly setting up a secure server component with Firebase Admin
    
    // On a real implementation, here you would:
    // 1. Call a secure API endpoint with Firebase Admin SDK
    // 2. Create or update the user in Firebase Auth
    // 3. Generate a custom token for the user with Firebase Admin
    // 4. Pass that token back to the client
    
    // For now, let's redirect back with the Discord ID so we can handle this properly
    return NextResponse.redirect(
      `${SITE_URL}/auth/discord-callback?id=${userData.id}&email=${userData.email}&username=${userData.username}`
    );

  } catch (error) {
    console.error('Discord auth error:', error);
    return NextResponse.redirect(
      `${SITE_URL}/auth/sign-in?error=auth_error`
    );
  }
} 