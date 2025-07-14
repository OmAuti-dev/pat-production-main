'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getEmployees() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const employees = await db.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'TEAM_LEADER']
        }
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        role: true
      }
    })

    // Transform employees to use database ID for task assignment
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,  // Use database ID for task assignment
      clerkId: employee.clerkId,
      name: employee.name,
      role: employee.role
    }))

    return { success: true, employees: transformedEmployees }
  } catch (error) {
    console.error('Error fetching employees:', error)
    return { success: false, error: 'Failed to fetch employees' }
  }
} 