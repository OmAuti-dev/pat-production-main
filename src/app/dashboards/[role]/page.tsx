import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface RoleDashboardProps {
  params: {
    role: string
  }
}

export default async function RoleDashboard({ params }: RoleDashboardProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  // Ensure user has access to this role's dashboard
  const userRole = session.user.role?.toLowerCase()
  if (userRole !== params.role.toLowerCase()) {
    // If user doesn't have access to this role's dashboard, redirect to their appropriate dashboard
    redirect(userRole ? `/dashboards/${userRole}` : '/dashboard')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 capitalize">
        {params.role} Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Add your role-specific dashboard content here */}
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name}</h2>
          <p className="text-muted-foreground">
            This is your {params.role} dashboard. Add your role-specific features here.
          </p>
        </div>
      </div>
    </div>
  )
} 