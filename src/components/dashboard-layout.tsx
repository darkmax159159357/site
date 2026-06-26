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
import { useAuth } from "@/components/auth-provider"

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
      <div className="h-screen w-full flex overflow-hidden bg-[#14161b]">
        <AppSidebar currentPath={pathname} />
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
            <header className="flex items-center justify-between py-4 border-b border-[#8b5cf6]/10 mb-6">
              <SidebarTrigger className="md:hidden" />

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#8b5cf6] hover:text-[#8b5cf6]/80">
                  <UserCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-[#8b5cf6] hover:text-[#8b5cf6]/80">
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
    <Sidebar className="border-r border-[#8b5cf6]/10 bg-[#1a1d24]">
      <SidebarHeader className="p-4 flex justify-center border-b border-[#8b5cf6]/10">
        <h1 className="text-xl font-bold text-[#8b5cf6]">Manga Dashboard</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#8b5cf6]/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin" || currentPath === "/dashboard"}
                  tooltip="Dashboard"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/manga" || currentPath === "/manga"}
                  tooltip="Manga List"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/manga">
                    <BookOpen className="h-4 w-4" />
                    <span>Manga List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/manga/add" || currentPath === "/manga/add"}
                  tooltip="Add Manga"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/manga/add">
                    <ListPlus className="h-4 w-4" />
                    <span>Add New Manga</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#8b5cf6]/70">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/settings" || currentPath === "/settings"}
                  tooltip="Settings"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/settings/users" || currentPath === "/settings/users"}
                  tooltip="User Management"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/settings/users">
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/settings/terminal" || currentPath === "/settings/terminal"}
                  tooltip="Terminal"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/settings/terminal">
                    <Terminal className="h-4 w-4" />
                    <span>Terminal Demo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentPath === "/admin/settings/server" || currentPath === "/settings/server"}
                  tooltip="Server"
                  className="hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors"
                >
                  <Link href="/admin/settings/server">
                    <Server className="h-4 w-4" />
                    <span>Server Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-[#8b5cf6]/10">
        <div className="text-sm text-[#8b5cf6]/60">Version 1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  )
} 