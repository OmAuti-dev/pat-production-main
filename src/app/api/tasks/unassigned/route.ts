import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user to check role
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'TEAM_LEADER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get unassigned tasks
    const tasks = await db.task.findMany({
      where: {
        assignedToId: {
          equals: undefined
        },
        status: 'PENDING'
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        description: true
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching unassigned tasks:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 