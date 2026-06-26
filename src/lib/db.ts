import fs from 'fs';
import path from 'path';
// Import UUID using require instead of ES modules
const { v4: uuidv4 } = require('uuid');
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';

// API Configuration from environment variables.
// NOTE: This legacy file-based/PHP user store is superseded by Firebase
// (firebaseAuth.ts / firebaseBookmarks.ts). The API_URL is only used by the
// legacy callAPI helper and defaults to empty so no dead host is contacted.
const API_URL = process.env.NEXT_PUBLIC_PHP_API_URL || '';
const API_KEY = process.env.PHP_API_KEY || 'medusa-admin-key-change-in-production';

// Use local path for development mode
const IS_DEV = process.env.NODE_ENV !== 'production';
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

// Ensure the data directory exists in dev mode
if (IS_DEV && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure the users file exists in dev mode
if (IS_DEV && !fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Ensure the tokens file exists in dev mode
if (IS_DEV && !fs.existsSync(TOKENS_FILE)) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify({}));
}

// Ensure the bookmarks file exists in dev mode
if (IS_DEV && !fs.existsSync(BOOKMARKS_FILE)) {
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify([]));
}

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // This will be hashed
  display_name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  bookmark_count?: number;
  coins: number; // User's coin balance
}

// Helper function to make API requests
async function callAPI(endpoint: string, params: Record<string, string> = {}, method = 'GET', body?: any) {
  const url = new URL(endpoint);
  
  // Add params to URL
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });
  
  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Get all users
export function getUsers(): User[] {
  console.log('Getting users');
  
  if (IS_DEV) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  } else {
    // For production, we'll just return an empty array since 
    // this function is only used for direct access, and we don't want to block
    // the flow. The real data will be accessed via the PHP API endpoints.
    return [];
  }
}

// Save users to file (only for dev mode)
function saveUsers(users: User[]): void {
  if (IS_DEV) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users file:', error);
    }
  }
}

// Find user by email
export function findUserByEmail(email: string): User | null {
  if (IS_DEV) {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  } else {
    // In production, this function is used during registration to check if user exists
    // We'll have to make a synchronous decision, so we'll return null 
    // and let the actual check happen in the API route
    return null;
  }
}

// Find user by username
export function findUserByUsername(username: string): User | null {
  if (IS_DEV) {
    const users = getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  } else {
    // In production, this function is used during registration to check if user exists
    // We'll have to make a synchronous decision, so we'll return null
    // and let the actual check happen in the API route
    return null;
  }
}

// Find user by ID
export function findUserById(id: string): User | null {
  if (IS_DEV) {
    const users = getUsers();
    return users.find(user => user.id === id) || null;
  } else {
    // In production, we'll make an API call to get user data
    // But since this is synchronous, we'll return null and let the actual API routes handle it
    return null;
  }
}

// Create a new user
export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'coins'>): Promise<User> {
  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Create new user
  const newUser: User = {
    id: uuidv4(),
    ...userData,
    password: hashedPassword,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    bookmark_count: 0,
    coins: 0 // Initialize coins to 0 for new users
  };
  
  if (IS_DEV) {
    const users = getUsers();
    
    // Check if user already exists
    if (findUserByEmail(userData.email) || findUserByUsername(userData.username)) {
      throw new Error('User already exists');
    }
    
    // Add to users array and save
    users.push(newUser);
    saveUsers(users);
  } else {
    // In production, we'll make an API call to register the user
    // But for now, just log that we would make this call
    console.log('Would make API call to register user:', newUser);
  }
  
  // Return the user without the password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
}

// Verify user credentials
export async function verifyUser(usernameOrEmail: string, password: string): Promise<Omit<User, 'password'> | null> {
  let user;
  
  if (IS_DEV) {
    const users = getUsers();
    
    // Find user by username or email
    user = users.find(
      u => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
           u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );
    
    if (!user) return null;
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
  } else {
    // For production, we'll verify in the API route
    // and just return a placeholder here
    return null;
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get all tokens
function getTokens(): Record<string, string> {
  if (IS_DEV) {
    try {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading tokens file:', error);
      return {};
    }
  }
  return {};
}

// Save tokens to file
function saveTokens(tokens: Record<string, string>): void {
  if (IS_DEV) {
    try {
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Error writing tokens file:', error);
    }
  }
}

// Generate a token (simple implementation)
export function generateToken(): string {
  return uuidv4();
}

// Store token
export function storeToken(userId: string, token: string): void {
  if (IS_DEV) {
    const tokens = getTokens();
    tokens[token] = userId;
    saveTokens(tokens);
  } else {
    // In production, we'll handle tokens in the API routes
    console.log('Would store token for user:', userId);
  }
}

// Verify token
export function verifyToken(token: string): string | null {
  if (IS_DEV) {
    const tokens = getTokens();
    return tokens[token] || null;
  } else {
    // In production, we'll handle token verification in the API routes
    // This is just a placeholder
    return 'dummy-user-id';
  }
}

// Remove token (logout)
export function removeToken(token: string): void {
  if (IS_DEV) {
    const tokens = getTokens();
    delete tokens[token];
    saveTokens(tokens);
  } else {
    // In production, we'll handle token removal in the API routes
    console.log('Would remove token:', token);
  }
}

// Bookmark interface
export interface Bookmark {
  id: string;
  userId: string;
  mangaId: string;
  title: string;
  cover?: string;
  lastReadChapter?: string;
  added_at: string;
  updated_at: string;
}

// Get all bookmarks
export function getBookmarks(): Bookmark[] {
  if (IS_DEV) {
    try {
      const data = fs.readFileSync(BOOKMARKS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading bookmarks file:', error);
      return [];
    }
  }
  return [];
}

// Save bookmarks to file
function saveBookmarks(bookmarks: Bookmark[]): void {
  if (IS_DEV) {
    try {
      fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
      console.error('Error writing bookmarks file:', error);
    }
  }
}

// Get user bookmarks
export function getUserBookmarks(userId: string): Bookmark[] {
  if (IS_DEV) {
    const bookmarks = getBookmarks();
    return bookmarks.filter(bookmark => bookmark.userId === userId);
  }
  return [];
}

// Check if manga is bookmarked by user
export function isBookmarked(userId: string, mangaId: string): boolean {
  if (IS_DEV) {
    const bookmarks = getBookmarks();
    return bookmarks.some(bookmark => bookmark.userId === userId && bookmark.mangaId === mangaId);
  }
  return false;
}

// Update user
export function updateUser(id: string, userData: Partial<User>): User | null {
  if (IS_DEV) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return null;
    
    // Update user data
    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updated_at: new Date().toISOString()
    };
    
    saveUsers(users);
    
    // Return updated user without password
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as User;
  } else {
    // In production, we'll handle this in the API route
    // This is just a placeholder
    return null;
  }
} 