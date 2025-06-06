import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function ClientDashboardLayout({
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

  if (!dbUser || dbUser.role !== 'CLIENT') {
    redirect('/')
  }

  return <>{children}</>
} 