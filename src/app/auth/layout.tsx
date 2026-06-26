"use client";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Log when the auth layout is mounted
    console.log("Auth layout mounted");
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
      <Footer />
    </div>
  );
}
