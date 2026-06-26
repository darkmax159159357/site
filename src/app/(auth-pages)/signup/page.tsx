"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerUser } from "@/lib/firebaseAuth"

// Form schema
const signUpSchema = z.object({
  username: z.string().min(5, "Username must be at least 5 characters").max(20, "Username must be less than 20 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(16, "Password must be less than 16 characters"),
})

type SignUpFormValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true)
    
    try {
      // Use Firebase for registration
      await registerUser(data.email, data.password, data.username);
      
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      })
      router.push("/login")
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = "An error occurred during registration";
      
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'Email already in use. Please use a different email.';
      } else if (error.message.includes('username-already-in-use')) {
        errorMessage = 'Username already taken. Please choose a different username.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Invalid email address.';
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14161b] p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF7F57]/5 via-[#14161b] to-[#14161b]"></div>
      
      {/* Simple header with logo */}
      <div className="absolute top-0 left-0 w-full p-4">
        <Link href="/" className="inline-block">
          <h1 className="font-passion-one text-2xl sm:text-3xl md:text-4xl text-[#FF7F57]">
            Medusa<span className="text-[#FF7F57]">Scans</span>
          </h1>
        </Link>
      </div>
      
      <Card className="w-full max-w-md border-[#FF7F57]/20 shadow-lg relative z-10 bg-[#1a1d24] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center text-gray-400">Enter your details to sign up</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                {...register("username")}
                className="border-[#FF7F57]/20 focus:border-[#FF7F57] bg-[#252830] text-white"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                className="border-[#FF7F57]/20 focus:border-[#FF7F57] bg-[#252830] text-white"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="border-[#FF7F57]/20 focus:border-[#FF7F57] bg-[#252830] text-white"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-[#FF7F57] hover:bg-[#e06a48] text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
            <p className="text-sm text-gray-400 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-[#FF7F57] hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 