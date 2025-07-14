import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import SidebarWrapper from '@/components/sidebar'
import { Input } from '@/components/ui/input'
import { Notifications } from '@/components/global/notifications'
import { ModeToggle } from '@/components/global/mode-toggle'
import { UserButton } from '@clerk/nextjs'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) {
    return redirect('/')
  }

  // Get user role from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true }
  })

  if (!dbUser) {
    return redirect('/')
  }

  // Handle role-based redirections
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  if (user.id && (pathname === '/' || pathname === '')) {
    switch (dbUser.role) {
      case 'MANAGER':
        return redirect('/manager/dashboard')
      case 'TEAM_LEADER':
        return redirect('/dashboards/team-leader')
    }
  }

  return (
    <main className="relative flex h-screen">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"></div>
      </div>
      <SidebarWrapper userRole={dbUser.role} />
      <div className="flex flex-col flex-1">
        {/* <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className="flex-1">
                <Input placeholder="Search..." />
            </div>
            <Notifications />
            <ModeToggle />
            <UserButton afterSignOutUrl="/" />
        </header> */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  )
}
