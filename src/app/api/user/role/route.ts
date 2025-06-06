import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await currentUser()

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Check if user exists in database
    let dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    // If user doesn't exist, create them with default role
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
          role: 'CLIENT' // Default role
        },
        select: { role: true }
      })
    }

    return new NextResponse(
      JSON.stringify({ role: dbUser.role }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in role API:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
} 