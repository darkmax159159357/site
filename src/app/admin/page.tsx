"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new admin dashboard
    router.push("/admin/dashboard")
  }, [router])

  // Show loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#14161b]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6]"></div>
      <p className="text-white mt-4">Loading admin dashboard...</p>
    </div>
  )
} 