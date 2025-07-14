import { db } from '@/lib/db'
import { auth, currentUser } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const task = await db.task.findUnique({
      where: { id: params.taskId },
      include: {
        assignedTo: true,
        project: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.assignedToId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to accept this task' }, { status: 403 })
    }

    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: {
        status: 'ACCEPTED'
      },
      include: {
        assignedTo: true,
        project: true
      }
    })

    // Send notification to task creator
    await db.notification.create({
      data: {
        title: 'Task Accepted',
        message: `${dbUser.name} has accepted the task "${task.title}"`,
        type: 'TASK_ACCEPTED',
        userId: task.creatorId
      }
    })

    // Trigger real-time notification
    await pusherServer.trigger(`user-${task.creatorId}`, 'notification', {
      title: 'Task Accepted',
      message: `${dbUser.name} has accepted the task "${task.title}"`
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error accepting task:', error)
    return NextResponse.json(
      { error: 'Failed to accept task' },
      { status: 500 }
    )
  }
} 