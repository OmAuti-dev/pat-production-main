import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export default async function ClientDashboard() {
  const user = await currentUser()
  
  // Get client's projects and workflows
  const workflows = await db.workflows.count({
    where: {
      userId: user?.id
    }
  })

  const projects = 0 // TODO: Add projects model
  const reports = 0 // TODO: Add reports model

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Client Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects}</p>
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
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reports}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 