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
    const validRoles = ['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'CLIENT']
    if (!validRoles.includes(role)) {
      return new NextResponse('Invalid role', { status: 400 })
    }

    // Update user role using internal ID
    const updatedEmployee = await db.user.update({
      where: {
        id: params.employeeId
      },
      data: {
        role
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        role: true,
        memberOfTeams: {
          select: {
            team: {
              select: {
                projects: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Format response
    const response = {
      id: updatedEmployee.id,
      clerkId: updatedEmployee.clerkId,
      name: updatedEmployee.name || '',
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      projects: updatedEmployee.memberOfTeams.flatMap(membership => 
        membership.team.projects.map(project => project.id)
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating employee role:', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 