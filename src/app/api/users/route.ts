import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if the requesting user is a manager
    const requestingUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (requestingUser?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Fetch all users
    const users = await db.user.findMany({
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

    // Transform the data to match the expected format
    const formattedUsers = users.map(user => ({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name || '',
      email: user.email,
      role: user.role,
      projects: user.memberOfTeams.flatMap(membership => 
        membership.team.projects.map(project => project.id)
      )
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('[USERS_GET]', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
} 