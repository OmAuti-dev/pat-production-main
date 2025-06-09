import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
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

    const { assigneeId, deadline, priority } = await req.json()

    if (!assigneeId || !deadline || !priority) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Update task with assignment details
    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: {
        assignedToId: assigneeId,
        dueDate: new Date(deadline),
        priority,
        status: 'ASSIGNED'
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            profileImage: true
          }
        }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error assigning task:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 