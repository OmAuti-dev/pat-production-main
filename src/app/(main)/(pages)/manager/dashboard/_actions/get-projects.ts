'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getProjects() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const projects = await db.project.findMany({
      where: {
        managerId: user.id
      },
      select: {
        id: true,
        name: true,
        type: true,
        progress: true
      }
    })

    return { success: true, projects }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects' }
  }
} 