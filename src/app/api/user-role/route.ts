import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

export async function GET() {
  try {
    const { userId } = auth()
    console.log('Checking role for user:', userId)

    if (!userId) {
      console.error('No userId found in auth')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, email: true }
    })

    console.log('Database user found:', user)

    if (!user) {
      console.error('No user found in database for clerkId:', userId)
      return new NextResponse('User not found', { status: 404 })
    }

    console.log('Returning role:', user.role)
    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error('[USER_ROLE_GET] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 