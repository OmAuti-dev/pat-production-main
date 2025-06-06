import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { RoleManagement } from './_components/role-management'
import { db } from '@/lib/db'

export default async function ManageRolesPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is a manager
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  })

  if (!user || user.role !== 'MANAGER') {
    redirect('/')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Roles & Project Access</h1>
      <RoleManagement />
    </div>
  )
} 