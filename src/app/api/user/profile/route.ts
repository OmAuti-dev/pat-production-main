import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { isValidSkill } from '@/config/skills'

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
        skills: true,
        experience: true,
        resumeUrl: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
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
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate skills
    if (data.skills && Array.isArray(data.skills)) {
      const invalidSkills = data.skills.filter((skill: string) => !isValidSkill(skill))
      if (invalidSkills.length > 0) {
        return NextResponse.json(
          { error: `Invalid skills: ${invalidSkills.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate experience
    if (typeof data.experience !== 'number' || data.experience < 0) {
      return NextResponse.json(
        { error: 'Experience must be a non-negative number' },
        { status: 400 }
      )
    }

    const updatedProfile = await db.user.update({
      where: { clerkId: user.id },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        skills: data.skills,
        experience: data.experience,
        resumeUrl: data.resumeUrl
      }
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