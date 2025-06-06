import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function PATCH(req: Request) {
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

    const { userId, role } = await req.json()

    if (!userId || !role) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[USER_ROLE_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 