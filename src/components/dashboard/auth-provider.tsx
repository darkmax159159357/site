"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Cookies from 'js-cookie'

type User = {
  username: string
  role: string
}

type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
})

// Cookie options - simplified to ensure they work across environments
const COOKIE_OPTIONS = {
  expires: 30, // 30 days
  path: '/',
  sameSite: 'lax' as const
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authCookie = Cookies.get("auth")
        console.log("Auth cookie found:", authCookie ? "yes" : "no")
        
        if (authCookie) {
          try {
            const parsedAuth = JSON.parse(authCookie)
            console.log("Auth cookie parsed:", parsedAuth)
            
            if (parsedAuth.isAuthenticated && parsedAuth.user) {
              setIsAuthenticated(true)
              setUser(parsedAuth.user)
              console.log("User authenticated from cookie")
            }
          } catch (error) {
            console.error("Failed to parse auth from cookie", error)
            // Clear invalid cookie
            Cookies.remove("auth", { path: '/' })
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call
    const users = [{ username: "admin", password: "admin", role: "admin" }]

    const user = users.find((u) => u.username === username && u.password === password)

    if (user) {
      const authData = {
        isAuthenticated: true,
        user: { username: user.username, role: user.role },
      }
      
      setIsAuthenticated(true)
      setUser({ username: user.username, role: user.role })
      
      // Store in cookie with simplified options
      try {
        const authJson = JSON.stringify(authData)
        console.log("Setting auth cookie:", authJson)
        
        // First remove any existing cookie to avoid conflicts
        Cookies.remove("auth", { path: '/' })
        
        // Set the new cookie
        Cookies.set("auth", authJson, COOKIE_OPTIONS)
        
        // Verify the cookie was set
        const verifySet = Cookies.get("auth")
        console.log("Verify cookie was set:", verifySet ? "yes" : "no")
        
        return true
      } catch (error) {
        console.error("Error setting auth cookie:", error)
        return false
      }
    }

    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    
    try {
      Cookies.remove("auth", { path: '/' })
      console.log("Auth cookie removed")
    } catch (error) {
      console.error("Error removing auth cookie:", error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 