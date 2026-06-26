"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminIndex() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user && userData) {
      if (userData.role !== "admin") {
        router.push("/");
      } else {
        setLoading(false);
      }
    }
  }, [user, userData, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#14161b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6]"></div>
        <p className="text-white mt-4">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Security Module */}
          <div className="bg-[#25262b] rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-[1.02]">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Security Settings</h2>
              <p className="text-gray-400 mb-4">Configure protection features, maintenance mode, and security options.</p>
              <div className="flex space-x-2 mt-4">
                <Link href="/admin/security-settings" className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-white">
                  Manage Settings
                </Link>
              </div>
            </div>
          </div>
          
          {/* Generate Codes */}
          <div className="bg-[#25262b] rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-[1.02]">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Generate Codes</h2>
              <p className="text-gray-400 mb-4">Create redemption codes for coins and special access.</p>
              <div className="flex space-x-2 mt-4">
                <Link href="/admin/generate-codes" className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md text-white">
                  Generate Codes
                </Link>
              </div>
            </div>
          </div>
          
          {/* Legacy Admin */}
          <div className="bg-[#25262b] rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-[1.02]">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Legacy Admin Panel</h2>
              <p className="text-gray-400 mb-4">Access the original admin dashboard.</p>
              <div className="flex space-x-2 mt-4">
                <a 
                  href="http://localhost:3001" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                >
                  Open Legacy Admin
                </a>
              </div>
            </div>
          </div>
          
          {/* User Management */}
          <div className="bg-[#25262b] rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-[1.02]">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">User Management</h2>
              <p className="text-gray-400 mb-4">Manage users, roles, and permissions.</p>
              <div className="flex space-x-2 mt-4">
                <Link href="/admin/users" className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-md text-white">
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 