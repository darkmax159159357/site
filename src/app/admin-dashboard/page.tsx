"use client"

import { useEffect } from "react"

export default function AdminDashboardPage() {
  useEffect(() => {
    // Open admin dashboard in a new tab instead of redirecting
    if (typeof window !== 'undefined') {
      window.open("http://localhost:3001", "_blank")
      // Navigate back to home after opening admin
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    }
  }, [])

  // Show loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#14161b]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6]"></div>
      <p className="text-white mt-4">Opening admin dashboard in a new tab...</p>
      <p className="text-gray-400 mt-2">You&apos;ll be redirected to home shortly.</p>
    </div>
  )
} 