import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { taskId, requiredSkills } = await req.json()

    // Find all users with matching skills
    const eligibleUsers = await db.user.findMany({
      where: {
        skills: {
          hasSome: requiredSkills
        }
      },
      select: {
        clerkId: true,
        name: true,
        skills: true,
        taskLoad: true,
        experience: true
      },
      orderBy: [
        { taskLoad: 'asc' },  // Prioritize users with lower task load
        { experience: 'desc' } // Then by experience level
      ]
    })

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ error: 'No eligible users found' }, { status: 404 })
    }

    // Select team leader (most experienced among eligible users)
    const teamLeader = eligibleUsers[0]

    // Create a new team
    const team = await db.team.create({
      data: {
        name: `Task ${taskId} Team`,
        leaderId: teamLeader.clerkId,
        members: {
          create: eligibleUsers.map(user => ({
            userId: user.clerkId
          }))
        }
      }
    })

    // Update task with team assignment
    await db.task.update({
      where: { id: taskId },
      data: {
        teamId: team.id
      }
    })

    // Update task load for all team members
    await Promise.all(
      eligibleUsers.map(user =>
        db.user.update({
          where: { clerkId: user.clerkId },
          data: {
            taskLoad: {
              increment: 1
            }
          }
        })
      )
    )

    return NextResponse.json({ 
      message: 'Team created and task assigned successfully',
      team: {
        id: team.id,
        leader: teamLeader,
        members: eligibleUsers
      }
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 