import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First get the user to get their clerkId
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get teams where the user is a leader
    const teams = await prisma.team.findMany({
      where: {
        leaderId: user.clerkId
      },
      include: {
        tasks: {
          include: {
            assignedTo: true
          }
        }
      }
    })

    // Flatten tasks from all teams and format them
    const tasks = teams.flatMap(team => 
      team.tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        deadline: task.dueDate,
        assignedTo: {
          name: task.assignedTo.name || 'Unassigned',
          profileImage: task.assignedTo.profileImage
        }
      }))
    )

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 