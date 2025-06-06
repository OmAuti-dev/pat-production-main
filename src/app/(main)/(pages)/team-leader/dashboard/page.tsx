import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export default async function TeamLeaderDashboard() {
  const user = await currentUser()
  
  // Get statistics from database
  const teamMembers = await db.user.count({
    where: {
      role: 'EMPLOYEE'
    }
  })

  const workflows = await db.workflows.count()
  const projects = 0 // TODO: Add projects model

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Team Leader Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{teamMembers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{workflows}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 