"use client";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDataSignInSchema } from "@/lib/schema";
import { toast } from "react-hot-toast";
import { signIn as firebaseSignIn } from "@/lib/firebaseAuth";
import { useRouter } from "next/navigation";

type Value = {
  email: string;
  password: string;
};

const useSignIn = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Value>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(FormDataSignInSchema),
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  
  const onSubmit: SubmitHandler<Value> = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log(`Attempting to sign in with email: ${data.email}`);
      
      // Use Firebase sign in
      await firebaseSignIn(data.email, data.password);
      
      console.log("Sign in successful");
      toast.success("Signed in successfully!");
      router.push("/");
    } catch (err: any) {
      console.error("Sign in exception:", err);
      
      // Handle specific Firebase auth errors
      if (err.message.includes("user-not-found") || err.message.includes("wrong-password")) {
        setAuthError("Invalid email or password");
      } else if (err.message.includes("too-many-requests")) {
        setAuthError("Too many failed login attempts. Please try again later.");
      } else if (err.message.includes("user-disabled")) {
        setAuthError("This account has been disabled.");
      } else {
        setAuthError("An error occurred during sign in");
      }
      
      toast.error(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    onSubmit, 
    isLoading, 
    authError,
    handleSubmit, 
    register, 
    errors, 
    isSubmitting 
  };
};

export default useSignIn;
