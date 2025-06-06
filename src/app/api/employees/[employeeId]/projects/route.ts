import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is a manager
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { projectId } = await req.json()

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Add user to project
    await db.userProject.create({
      data: {
        userId: parseInt(params.employeeId),
        projectId: projectId
      }
    })

    // Get updated user with projects
    const updatedEmployee = await db.user.findUnique({
      where: { id: parseInt(params.employeeId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userProjects: {
          select: {
            projectId: true
          }
        }
      }
    })

    if (!updatedEmployee) {
      return new NextResponse('Employee not found', { status: 404 })
    }

    // Format response
    const response = {
      id: updatedEmployee.id.toString(),
      name: updatedEmployee.name || '',
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      projects: updatedEmployee.userProjects.map(p => p.projectId)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error assigning project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { employeeId: string; projectId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if user is a manager
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Remove user from project
    await db.userProject.delete({
      where: {
        userId_projectId: {
          userId: parseInt(params.employeeId),
          projectId: params.projectId
        }
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing from project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 