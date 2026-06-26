"use client";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDataSignUpSchema } from "@/lib/schema";
import { toast } from "react-hot-toast";
import { registerUser } from "@/lib/firebaseAuth";
import { useRouter } from "next/navigation";

type Value = {
  username: string;
  email: string;
  password: string;
};

const useSignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Value>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(FormDataSignUpSchema),
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const router = useRouter();
  
  const onSubmit: SubmitHandler<Value> = async (data) => {
    setIsLoading(true);
    setSignUpError(null);
    
    try {
      console.log("Starting user registration process for:", data.username, data.email);
      
      // Register user with Firebase
      await registerUser(data.email, data.password, data.username);
      
      console.log("Registration successful");
      toast.success("Registration successful!");
      router.push("/");
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Handle specific Firebase auth errors
      if (err.message?.includes("email-already-in-use")) {
        console.log("Email already in use error");
        setSignUpError("Email already in use. Please use a different email or sign in.");
      } else if (err.message?.includes("username-already-in-use")) {
        console.log("Username already taken error");
        setSignUpError("Username already taken. Please choose a different username.");
      } else if (err.message?.includes("weak-password")) {
        console.log("Weak password error");
        setSignUpError("Password is too weak. Please use a stronger password.");
      } else if (err.message?.includes("invalid-email")) {
        console.log("Invalid email error");
        setSignUpError("Invalid email address.");
      } else {
        console.log("Generic error:", err.message || "Unknown error");
        setSignUpError("An error occurred during registration");
      }
      
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    onSubmit, 
    isLoading, 
    signUpError,
    handleSubmit, 
    register, 
    errors, 
    isSubmitting 
  };
};

export default useSignUp;
