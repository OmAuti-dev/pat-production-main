import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import CreateProjectButton from './_components/create-project-button'
import ProjectSelector from './_components/project-selector'
import { getClients, getProjects } from './_actions/project'
import ProjectCard from './_components/project-card'

type Project = {
  id: string
  name: string
  description: string
  type: string
  progress: number
  client?: {
    name: string
  }
}

export default async function ProjectsPage() {
  const user = await currentUser()
  if (!user) return null

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true }
  })

  const projects = await getProjects()

  // Only fetch clients if user is a manager
  const clients = dbUser?.role === 'MANAGER' ? await getClients() : []

  // Get all employees for project assignments
  const employees = dbUser?.role === 'MANAGER' || dbUser?.role === 'TEAM_LEADER' 
    ? await db.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: { clerkId: true, name: true }
      })
    : []

  return (
    <div className="relative flex flex-col gap-4">
      <div className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
        <h1 className="text-4xl">Projects</h1>
        {dbUser?.role === 'MANAGER' ? (
          <CreateProjectButton clients={clients} />
        ) : (
          <ProjectSelector projects={projects} />
        )}
      </div>
      
      {/* Project list section */}
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {dbUser?.role === 'MANAGER' 
              ? "You haven't created any projects yet. Click the 'Create Project' button to get started."
              : "You don't have any projects assigned yet."}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
                userRole={dbUser?.role || ''}
                employees={employees.map(emp => ({
                  id: emp.clerkId,
                  name: emp.name || 'Unnamed Employee'
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 