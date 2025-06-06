import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Get user role from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true }
  })

  if (!dbUser) {
    redirect('/')
  }

  // Get the current path from headers
  const headersList = headers()
  const path = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const userRole = dbUser.role.toLowerCase()

  // Check if user is accessing their correct dashboard
  if (!path.startsWith(`/dashboards/${userRole}`)) {
    redirect(`/dashboards/${userRole}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Role: {dbUser.role}
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
} 