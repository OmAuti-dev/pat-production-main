import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { progress } = await req.json()

    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    // Check if user is team leader for this task
    const task = await db.task.findUnique({
      where: { id: params.taskId },
      include: {
        team: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.team?.leaderId !== user.id) {
      return NextResponse.json(
        { error: 'Only team leader can update task progress' },
        { status: 403 }
      )
    }

    // Update task progress
    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: { progress }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 