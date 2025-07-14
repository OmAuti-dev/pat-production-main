'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

interface CreateTeamData {
  name: string
  description: string
  leaderId: string
  memberIds: string[]
}

export async function createTeam(data: CreateTeamData) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the user's internal database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      return { success: false, error: 'Not authorized to create teams' }
    }

    // Create the team
    const team = await db.team.create({
      data: {
        name: data.name,
        description: data.description,
        leaderId: data.leaderId,
        members: {
          connect: data.memberIds.map(id => ({ id }))
        }
      },
      include: {
        leader: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            skills: true
          }
        }
      }
    })

    // Revalidate relevant paths
    revalidatePath('/teams')
    revalidatePath('/manager/dashboard')
    revalidatePath('/team-leader/dashboard')
    
    return { success: true, team }
  } catch (error) {
    console.error('Error creating team:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create team'
    }
  }
} 