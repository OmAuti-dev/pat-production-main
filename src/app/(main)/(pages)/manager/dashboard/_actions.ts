import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export type TaskWithRelations = {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  assignedTo: {
    name: string | null
    profileImage: string | null
  }
  Project: {
    name: string
  }
}

export async function getDashboardData() {
  const user = await currentUser()
  if (!user) throw new Error('Not authenticated')

  // Get projects from database
  const projects = await db.project.findMany({
    orderBy: {
      updatedAt: 'desc'
    },
    take: 3
  })

  // Get tasks from database
  const tasks = await db.task.findMany({
    include: {
      assignedTo: true,
      Project: true
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  }) as TaskWithRelations[]

  // Get campaigns from database
  const campaigns = await db.campaign.findMany({
    orderBy: {
      date: 'desc'
    },
    take: 2
  })

  // Calculate project completion stats
  const projectStats = {
    total: await db.project.count(),
    completed: await db.project.count({
      where: {
        progress: 100
      }
    }),
    inProgress: await db.project.count({
      where: {
        progress: {
          gt: 0,
          lt: 100
        }
      }
    })
  }

  return {
    projects,
    tasks,
    campaigns,
    projectStats
  }
} 