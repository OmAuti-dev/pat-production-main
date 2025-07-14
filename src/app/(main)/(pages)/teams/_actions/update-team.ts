'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

interface UpdateTeamData {
  id: string
  name: string
  description: string
  leaderId: string
  memberIds: string[]
}

export async function updateTeam(data: UpdateTeamData) {
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

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    // Get the team to check permissions
    const team = await db.team.findUnique({
      where: { id: data.id },
      select: { leaderId: true }
    })

    if (!team) {
      return { success: false, error: 'Team not found' }
    }

    // Only managers or the team leader can update the team
    if (dbUser.role !== 'MANAGER' && team.leaderId !== dbUser.id) {
      return { success: false, error: 'Not authorized to update this team' }
    }

    // Update the team
    const updatedTeam = await db.team.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        leaderId: data.leaderId,
        members: {
          set: data.memberIds.map(id => ({ id }))
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
    
    return { success: true, team: updatedTeam }
  } catch (error) {
    console.error('Error updating team:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update team'
    }
  }
} 