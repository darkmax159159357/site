import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Check if file exists
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Read users file
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    // Remove sensitive data (password hashes)
    const safeUsers = users.map((user: any) => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    if (userId) {
      // Find specific user
      const user = safeUsers.find((user: any) => user.id === userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    } else {
      // Return all users (without passwords)
      return NextResponse.json(safeUsers);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 