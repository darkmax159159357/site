"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BookOpen, ListPlus, Home, Settings, Users, Terminal, UserCircle, LogOut, Server } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/components/dashboard/auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex overflow-hidden">
        <AppSidebar currentPath={pathname} />
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
            <header className="flex items-center justify-between py-4">
              <SidebarTrigger className="md:hidden" />

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

function AppSidebar({ currentPath }: { currentPath: string }) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex justify-center">
        <h1 className="text-xl font-bold">Manga Dashboard</h1>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin-dashboard"}
                  tooltip="Dashboard"
                  className="hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/admin-dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin-dashboard/manga"}
                  tooltip="Manga List"
                  className="hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/admin-dashboard/manga">
                    <BookOpen className="h-4 w-4" />
                    <span>Manga Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin-dashboard/settings"}
                  tooltip="Settings"
                  className="hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/admin-dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={false}
                  tooltip="Back to Site"
                  className="hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Link href="/">
                    <Server className="h-4 w-4" />
                    <span>Back to Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-sm text-muted-foreground">Version 1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  )
} 