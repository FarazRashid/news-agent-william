"use client"

import { Menu, PanelLeftClose, PanelRightClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createContext, useContext, useState, ReactNode } from "react"

// Context to manage sidebar state across components
type SidebarContextType = {
  isCollapsed: boolean
  toggleSidebar: () => void
  isRightCollapsed: boolean
  toggleRightSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  
  const toggleSidebar = () => setIsCollapsed(prev => !prev)
  const toggleRightSidebar = () => setIsRightCollapsed(prev => !prev)
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isRightCollapsed, toggleRightSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }
  return context
}

export default function Header() {
  const { toggleSidebar, toggleRightSidebar } = useSidebarContext()
  
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          
          <button className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">wealth manager</h1>
        </div>

        <nav className="hidden md:flex gap-8">
          <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 pb-2 border-b-2 border-primary">
            Dashboard
          </a>
          {/* <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Investments
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Markets
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            News
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Reports
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Analytics
          </a> */}
        </nav>

        <div className="flex gap-3">
        
           
          {/* <Button variant="ghost" className="text-sm">
            Sign In
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90 text-sm">Get Started</Button> */}
        </div>
      </div>
    </header>
  )
}
