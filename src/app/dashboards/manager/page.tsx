import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export default async function ManagerDashboard() {
  const user = await currentUser()
  
  // Get user data from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: user?.id },
    select: {
      name: true,
      email: true,
      role: true
    }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold">Welcome, {dbUser?.name}</h2>
        <p className="text-muted-foreground">Manager Dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Projects</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Team Members</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Tasks</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
} 