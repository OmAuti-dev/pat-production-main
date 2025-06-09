import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get projects based on user's role
    const projects = await db.project.findMany({
      where: dbUser.role === 'MANAGER' ? {} : {
        OR: [
          { teamMembers: { some: { user: { clerkId: userId } } } },
          { tasks: { some: { assignedToId: userId } } }
        ]
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        },
        manager: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedToId: true,
            createdById: true
          }
        }
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Only managers can create projects
    if (dbUser.role !== 'MANAGER') {
      return new NextResponse('Not authorized to create projects', { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, clientId } = body

    if (!name || !description || !type || !clientId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        type,
        clientId,
        managerId: userId,
        progress: 0
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
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