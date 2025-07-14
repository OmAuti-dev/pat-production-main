import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First get the user's database ID
    const user = await db.user.findUnique({
      where: { 
        clerkId: userId 
      },
      select: {
        id: true,
        role: true
      }
    })

    if (!user || user.role !== 'TEAM_LEADER') {
      return new NextResponse('User not found or not authorized', { status: 404 })
    }

    // Get tasks for projects where the user is a leader
    const tasks = await db.task.findMany({
      where: {
        OR: [
          // Tasks from projects where user is a leader
          {
            project: {
              managerId: user.id
            }
          },
          // Tasks directly assigned to the team leader
          {
            assignedToId: user.id
          }
        ]
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format tasks for the response
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        role: task.assignedTo.role
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : null
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 