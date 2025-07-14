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

    // Fetch all users with their project associations
    const users = await db.user.findMany({
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        skills: true,
        experience: true,
        resumeUrl: true,
        tier: true,
        credits: true,
        managedProjects: {
          select: {
            id: true
          }
        },
        clientProjects: {
          select: {
            id: true
          }
        },
        assignedTasks: {
          select: {
            projectId: true
          }
        }
      }
    })

    // Transform the data to match the expected format
    const formattedUsers = users.map(user => {
      // Get unique project IDs from all associations
      const projectIds = new Set<string>()
      
      // Add projects from managed projects
      user.managedProjects.forEach(p => projectIds.add(p.id))
      
      // Add projects from client projects
      user.clientProjects.forEach(p => projectIds.add(p.id))
      
      // Add projects from assigned tasks
      user.assignedTasks
        .filter(t => t.projectId !== null)
        .forEach(t => t.projectId && projectIds.add(t.projectId))

      // Only include additional fields for non-client users
      const baseUser = {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name || '',
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        projects: Array.from(projectIds)
      }

      if (user.role !== 'CLIENT') {
        return {
          ...baseUser,
          skills: user.skills,
          experience: user.experience,
          resumeUrl: user.resumeUrl,
          tier: user.tier,
          credits: user.credits
        }
      }

      return baseUser
    })

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('[USERS_GET]', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
} 