import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('projectId')

    const where: Prisma.TaskWhereInput = {
      OR: query ? [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ] : undefined,
      status: status || undefined,
      priority: priority || undefined,
      projectId: projectId || undefined,
      assignedToId: dbUser.id.toString()
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: true,
        assignedTo: true,
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, description, priority, dueDate, projectId } = data

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        createdBy: {
          connect: {
            id: dbUser.id
          }
        },
        ...(projectId && {
          project: {
            connect: {
              id: projectId
            }
          }
        }),
        deadline: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: true,
        assignedTo: true,
        createdBy: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { id, title, status, priority } = body

    if (!id) {
      return new NextResponse('Task ID is required', { status: 400 })
    }

    const task = await db.task.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    if (task.assignedToId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(status && { status }),
        ...(priority && { priority })
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: true
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('[TASKS_PUT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 })
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    if (task.assignedToId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    await db.task.delete({
      where: { id: taskId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[TASKS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 