import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Syncing user to database:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
    })

    // Create or update user in database
    const dbUser = await db.user.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        profileImage: user.imageUrl,
        role: 'CLIENT' // Default role for new users
      },
      update: {
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        profileImage: user.imageUrl
      }
    })

    console.log('User synced successfully:', dbUser)

    return NextResponse.json({ 
      message: 'User synced successfully',
      user: dbUser
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ 
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 