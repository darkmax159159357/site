"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function DiscordCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Get Discord user data from URL params
        const id = searchParams.get("id");
        const email = searchParams.get("email");
        const username = searchParams.get("username");
        
        if (!id || !email) {
          throw new Error("Missing Discord user data");
        }
        
        // Call your secure API to generate a Firebase custom token
        // This would be a server-side function that uses Firebase Admin SDK
        const tokenRes = await fetch("/api/auth/create-custom-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discordId: id,
            email,
            username
          }),
        });
        
        if (!tokenRes.ok) {
          throw new Error("Failed to get authentication token");
        }
        
        const { customToken } = await tokenRes.json();
        
        // Sign in with the custom token
        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            displayName: username,
            role: "user",
            createdAt: new Date().toISOString(),
            discordId: id
          });
        }
        
        setStatus("success");
        toast.success("Signed in with Discord successfully!");
        
        // Redirect to home page
        setTimeout(() => {
          router.push("/");
        }, 1000);
        
      } catch (error: any) {
        console.error("Discord auth completion error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Authentication failed");
        toast.error("Authentication failed. Please try again.");
      }
    };
    
    completeAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          {status === "loading" && (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-white">
                Completing Sign In
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Please wait while we authenticate your Discord account...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#df5f39]"></div>
              </div>
            </>
          )}
          
          {status === "error" && (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-white">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-red-400">
                {errorMessage}
              </p>
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="mt-4 w-full py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#df5f39] hover:bg-[#f0673e] focus:outline-none"
              >
                Back to Sign In
              </button>
            </>
          )}
          
          {status === "success" && (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-white">
                Sign In Successful
              </h2>
              <p className="mt-2 text-sm text-green-400">
                You have successfully signed in with Discord!
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Redirecting to homepage...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 