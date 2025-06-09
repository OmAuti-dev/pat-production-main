import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome to Your Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.firstName || 'User'}</h2>
          <p className="text-muted-foreground">
            This is your default dashboard. Contact an administrator to get assigned to a specific role.
          </p>
        </div>
      </div>
    </div>
  )
} 