import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
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

    const employees = await db.user.findMany({
      select: {
        id: true,
        clerkId: true,
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

    // Transform the data to match the expected format
    const formattedEmployees = employees.map(emp => ({
      id: emp.clerkId, // Use clerkId as the ID since that's what the role update API expects
      name: emp.name || '',
      email: emp.email,
      role: emp.role,
      projects: emp.userProjects.map(p => p.projectId)
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 