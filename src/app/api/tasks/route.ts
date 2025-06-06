import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    const where = {
      userId,
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              name: true,
              profileImage: true
            }
          },
          Project: true
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[TASKS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { title, projectId, status = 'TODO', priority = 'MEDIUM' } = body

    if (!title || !projectId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project || project.userId !== userId) {
      return new NextResponse('Project not found or unauthorized', { status: 404 })
    }

    const task = await db.task.create({
      data: {
        title,
        projectId,
        status,
        priority,
        userId
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            profileImage: true
          }
        },
        Project: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('[TASKS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
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
      include: { Project: true }
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    if (task.userId !== userId) {
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
            name: true,
            profileImage: true
          }
        },
        Project: true
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
      include: { Project: true }
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    if (task.userId !== userId) {
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