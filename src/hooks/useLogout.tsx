"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { signOut } from "@/lib/firebaseAuth";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success("Successfully logged out");
      router.push("/auth/sign-in");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to log out");
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};

export default useLogout; 