import { NextRequest, NextResponse } from "next/server";
import { getAllMangaViews } from '@/app/services/viewTracker';
import { getUsers, getBookmarks } from '@/lib/db';
import type { User } from '@/lib/db';
import path from 'path';
import fs from 'fs';

// Admin API key for secure access
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'medusa-admin-key-change-in-production';

export async function GET(req: NextRequest) {
  try {
    // Check for API key
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }
    
    // Get the requested data type
    const { searchParams } = new URL(req.url);
    const dataType = searchParams.get('type');
    
    if (!dataType) {
      return NextResponse.json(
        { success: false, message: 'Missing data type parameter' },
        { status: 400 }
      );
    }
    
    let data;
    
    // Return the requested data
    switch (dataType) {
      case 'users':
        data = getUsers().map((user: User) => {
          // Don't expose hashed passwords
          const { password, ...safeUser } = user;
          return safeUser;
        });
        break;
        
      case 'bookmarks':
        data = getBookmarks();
        break;
        
      case 'manga_views':
        data = getAllMangaViews();
        break;
        
      case 'user':
        const userId = searchParams.get('id');
        if (!userId) {
          return NextResponse.json(
            { success: false, message: 'Missing user ID parameter' },
            { status: 400 }
          );
        }
        const users = getUsers();
        const user = users.find((u: User) => u.id === userId);
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }
        // Don't expose hashed password
        const { password, ...safeUser } = user;
        data = safeUser;
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid data type requested' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (err: any) {
    console.error('Error in admin data API:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 