"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarProviderProps {
  children: React.ReactNode
}

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
})

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

interface SidebarProps {
  className?: string
  children?: React.ReactNode
}

export function Sidebar({ className, children }: SidebarProps) {
  const { isOpen } = useSidebar()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      {children}
    </aside>
  )
}

interface SidebarHeaderProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarHeader({ className, children }: SidebarHeaderProps) {
  return (
    <div className={cn("border-b px-4 py-3", className)}>
      {children}
    </div>
  )
}

interface SidebarContentProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarContent({ className, children }: SidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-auto p-4", className)}>
      {children}
    </div>
  )
}

interface SidebarFooterProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarFooter({ className, children }: SidebarFooterProps) {
  return (
    <div className={cn("border-t px-4 py-3", className)}>
      {children}
    </div>
  )
}

interface SidebarTriggerProps {
  className?: string
}

export function SidebarTrigger({ className }: SidebarTriggerProps) {
  const { isOpen, setIsOpen } = useSidebar()

  return (
    <button
      className={cn("p-2", className)}
      onClick={() => setIsOpen(!isOpen)}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <line x1="9" x2="15" y1="3" y2="3" />
        <line x1="9" x2="15" y1="21" y2="21" />
        <line x1="9" x2="9" y1="9" y2="15" />
        <line x1="15" x2="15" y1="9" y2="15" />
      </svg>
    </button>
  )
}

interface SidebarSeparatorProps {
  className?: string
}

export function SidebarSeparator({ className }: SidebarSeparatorProps) {
  return (
    <div className={cn("my-2 h-px bg-border", className)} />
  )
}

interface SidebarGroupProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarGroup({ className, children }: SidebarGroupProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  )
}

interface SidebarGroupLabelProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarGroupLabel({ className, children }: SidebarGroupLabelProps) {
  return (
    <div className={cn("mb-2 text-xs font-semibold uppercase text-muted-foreground", className)}>
      {children}
    </div>
  )
}

interface SidebarGroupContentProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarGroupContent({ className, children }: SidebarGroupContentProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  )
}

interface SidebarMenuProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarMenu({ className, children }: SidebarMenuProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {children}
    </nav>
  )
}

interface SidebarMenuItemProps {
  className?: string
  children?: React.ReactNode
}

export function SidebarMenuItem({ className, children }: SidebarMenuItemProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

interface SidebarMenuButtonProps {
  className?: string
  children?: React.ReactNode
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
}

export function SidebarMenuButton({
  className,
  children,
  isActive,
  tooltip,
  asChild = false,
}: SidebarMenuButtonProps) {
  const Comp = asChild ? React.Fragment : "button"
  
  return (
    <Comp
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      title={tooltip}
    >
      {children}
    </Comp>
  )
} 