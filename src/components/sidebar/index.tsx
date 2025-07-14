'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Settings,
  Users,
  Workflow,
  Building2,
  Network,
  Bot,
  Menu,
  Plus,
  KanbanSquare
} from 'lucide-react'

type Props = {
  userRole: 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE' | 'CLIENT' | 'ADMIN'
}

const roleBasedNavigation = {
  MANAGER: [
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teams', label: 'Team Management', icon: Users },
    { href: '/workflows', label: 'Workflows', icon: Workflow },
    { href: '/projects', label: 'Projects', icon: Building2 },
    { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { href: '/connections', label: 'Connections', icon: Network },
    { href: '/dashboards/manager/manage-roles', label: 'Manage Roles', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teams', label: 'Team Management', icon: Users },
    { href: '/workflows', label: 'Workflows', icon: Workflow },
    { href: '/projects', label: 'Projects', icon: Building2 },
    { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { href: '/connections', label: 'Connections', icon: Network },
    { href: '/dashboards/manager/manage-roles', label: 'Manage Roles', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  TEAM_LEADER: [
    { href: '/dashboards/team-leader', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teams', label: 'My Teams', icon: Users },
    { href: '/workflows', label: 'Workflows', icon: Workflow },
    { href: '/projects', label: 'Projects', icon: Building2 },
    { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { href: '/connections', label: 'Connections', icon: Network },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  EMPLOYEE: [
    { href: '/dashboards/employee', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/workflows', label: 'My Tasks', icon: Workflow },
    { href: '/projects', label: 'Projects', icon: Building2 },
    { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { href: '/connections', label: 'Connections', icon: Network },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  CLIENT: [
    { href: '/dashboards/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userRole: Props["userRole"]
}

export function Sidebar({ className, userRole }: SidebarProps) {
  const pathname = usePathname()
  const navigation = roleBasedNavigation[userRole]

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex h-14 items-center px-3 mb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Bot className="h-6 w-6" />
              <span className="text-xl font-semibold tracking-tight">PAT.</span>
            </Link>
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-secondary/80 font-medium"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        {userRole !== 'CLIENT' && (
          <div className="px-3 py-2">
            <Separator className="mb-4" />
            <Link href="/workflows">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                New Workflow
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

interface MobileSidebarProps extends Props {
  children?: React.ReactNode
}

export function MobileSidebar({ userRole, children }: MobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <Sidebar userRole={userRole} />
          {children}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default function SidebarWrapper({ userRole }: Props) {
  return (
    <>
      <aside className="hidden border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <ScrollArea className="h-screen w-64">
          <Sidebar userRole={userRole} />
        </ScrollArea>
      </aside>
      <div className="md:hidden">
        <MobileSidebar userRole={userRole} />
      </div>
    </>
  )
}
