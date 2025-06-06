import { db } from '@/lib/db'
import { auth, currentUser } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        userId: null,
        clerkUser: null,
        dbUser: null
      }, { status: 401 })
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true,
        clerkId: true,
        role: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      authenticated: true,
      userId,
      clerkUser: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        metadata: user.publicMetadata
      },
      dbUser
    })
  } catch (error) {
    console.error('[TEST_AUTH]', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 