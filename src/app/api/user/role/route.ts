import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Get current user's role
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ role: dbUser.role })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update user role (manager only)
export async function PATCH(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if the requesting user is a manager
    const requestingUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (requestingUser?.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, role } = await req.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update user role using clerkId
    const updatedUser = await db.user.update({
      where: { clerkId: userId },
      data: { role },
      select: {
        clerkId: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[USER_ROLE_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 