import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.user.findUnique({
      where: { clerkId: user.id },
      select: {
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        skills: true,
        experience: true,
        resumeUrl: true,
        tier: true,
        credits: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Ensure all fields have default values
    return NextResponse.json({
      ...profile,
      skills: profile.skills || [],
      experience: profile.experience || 0,
      resumeUrl: profile.resumeUrl || '',
      tier: profile.tier || 'Free',
      credits: profile.credits || '10'
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Get the user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Base update data
    const updateData = {
      name: data.name,
      phoneNumber: data.phoneNumber || null
    }

    // Add additional fields for non-client users
    if (dbUser.role !== Role.CLIENT) {
      Object.assign(updateData, {
        skills: Array.isArray(data.skills) ? data.skills : [],
        experience: typeof data.experience === 'number' ? data.experience : 0,
        resumeUrl: data.resumeUrl || null,
        tier: data.tier || 'Free',
        credits: data.credits || '10'
      })
    }

    const updatedProfile = await db.user.update({
      where: { clerkId: clerkUser.id },
      data: updateData
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 