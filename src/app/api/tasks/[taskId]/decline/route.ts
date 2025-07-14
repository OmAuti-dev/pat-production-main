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

    const { reason } = await request.json()
    if (!reason) {
      return NextResponse.json({ error: 'Decline reason is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Not authorized to decline this task' }, { status: 403 })
    }

    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: {
        status: 'DECLINED',
        declineReason: reason,
        assignedToId: null // Unassign the task
      },
      include: {
        assignedTo: true,
        project: true
      }
    })

    // Send notification to task creator
    await db.notification.create({
      data: {
        title: 'Task Declined',
        message: `${dbUser.name} has declined the task "${task.title}". Reason: ${reason}`,
        type: 'TASK_DECLINED',
        userId: task.creatorId
      }
    })

    // Trigger real-time notification
    await pusherServer.trigger(`user-${task.creatorId}`, 'notification', {
      title: 'Task Declined',
      message: `${dbUser.name} has declined the task "${task.title}". Reason: ${reason}`
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error declining task:', error)
    return NextResponse.json(
      { error: 'Failed to decline task' },
      { status: 500 }
    )
  }
} 