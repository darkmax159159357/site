import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import fs from 'fs';
import path from 'path';
import { compare } from 'bcrypt';

// Local path to the Medusa folder
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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        
        try {
          console.log(`Attempting to authenticate user: ${credentials.email}`);
          
          // Ensure directories exist
          ensureUserDirectory();
          
          // Read the users file
          if (!fs.existsSync(USERS_FILE_PATH)) {
            throw new Error("Users file not found");
          }
          
          const usersData = fs.readFileSync(USERS_FILE_PATH, 'utf8');
          const users = JSON.parse(usersData);
          
          // Find user by email
          const user = users.find((user: any) => 
            user.email.toLowerCase() === credentials.email.toLowerCase()
          );
          
          if (!user) {
            console.log("User not found");
            throw new Error("Invalid credentials");
          }
          
          // Verify password
          // Note: Assuming password is stored with bcrypt
          const isPasswordValid = await compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log("Password verification failed");
            throw new Error("Invalid credentials");
          }
          
          // Return the user for the session (without password)
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: "USER"
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET,
  },
  pages: {
    signIn: "/auth/sign-in",
  },
};
