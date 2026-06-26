"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define user type
type User = {
  username: string
  role: string
}

// Define auth context type
type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
})

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Login function - super simple
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log("Simple login function called with:", { username, password })
    
    // Direct check for hardcoded credentials
    if (username === "admin" && password === "admin") {
      console.log("Credentials match, setting authenticated state")
      
      // Set state directly
      setIsAuthenticated(true)
      setUser({ username: "admin", role: "admin" })
      
      console.log("Login successful, returning true")
      return true
    }
    
    console.log("Login failed - credentials don't match")
    return false
  }

  // Logout function
  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  // Return provider
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export const useAuth = () => useContext(AuthContext) 