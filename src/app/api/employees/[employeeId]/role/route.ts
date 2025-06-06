import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function PATCH(
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

    const { role } = await req.json()

    // Validate role
    const validRoles = ['employee', 'manager', 'team_leader', 'client']
    if (!validRoles.includes(role.toLowerCase())) {
      return new NextResponse('Invalid role', { status: 400 })
    }

    const updatedEmployee = await db.user.update({
      where: {
        id: parseInt(params.employeeId)
      },
      data: {
        role: role.toUpperCase()
      },
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
    console.error('Error updating employee role:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 