import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where = {
      userId,
      ...(status && { 
        progress: status === 'completed' ? 100 : 
                 status === 'in_progress' ? { gt: 0, lt: 100 } :
                 0
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[PROJECTS_GET]', error)
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
    const { name, type } = body

    if (!name || !type) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        type,
        userId,
        progress: 0
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('[PROJECTS_POST]', error)
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
    const { id, name, type, progress } = body

    if (!id) {
      return new NextResponse('Project ID is required', { status: 400 })
    }

    const project = await db.project.findUnique({
      where: { id }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    if (project.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(typeof progress === 'number' && { progress })
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('[PROJECTS_PUT]', error)
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
    const projectId = searchParams.get('id')

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 })
    }

    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    if (project.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    await db.project.delete({
      where: { id: projectId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[PROJECTS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GETAllProjects() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is a manager
    const user = await db.user.findUnique({
      where: { clerkId: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 