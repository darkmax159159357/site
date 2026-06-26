import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { compare } from 'bcrypt';
import { randomBytes } from 'crypto';

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');
const USER_DATA_PATH = path.join(MEDUSA_PATH, 'user_dat');
const USERS_FILE_PATH = path.join(USER_DATA_PATH, 'users.json');

// Ensure the user_dat directory exists
const ensureUserDirectory = () => {
  if (!fs.existsSync(USER_DATA_PATH)) {
    fs.mkdirSync(USER_DATA_PATH, { recursive: true });
  }
  
  if (!fs.existsSync(USERS_FILE_PATH)) {
    fs.writeFileSync(USERS_FILE_PATH, '[]', 'utf8');
  }
};

export async function POST(request: Request) {
  try {
    ensureUserDirectory();
    
    const { username, email, password } = await request.json();
    
    if ((!username && !email) || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/email and password are required' },
        { status: 400 }
      );
    }
    
    // Read the users file
    const usersData = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    const users = JSON.parse(usersData);
    
    // Find user by username or email
    const user = users.find((user: any) => 
      (username && user.username.toLowerCase() === username.toLowerCase()) || 
      (email && user.email.toLowerCase() === email.toLowerCase())
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate a token
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    
    // Update user with token
    user.session_token = token;
    user.token_expires_at = expiresAt;
    user.last_login = new Date().toISOString();
    
    // Save updated users
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
    
    // Create user object without password
    const userResponse = { ...user };
    delete userResponse.password;
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 