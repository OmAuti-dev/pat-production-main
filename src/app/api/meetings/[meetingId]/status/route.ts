import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const { status } = data

    // Update the meeting attendee status
    const updatedAttendee = await db.meetingAttendee.update({
      where: {
        meetingId_userId: {
          meetingId: params.meetingId,
          userId: dbUser.id,
        },
      },
      data: {
        status,
      },
      include: {
        meeting: {
          include: {
            organizer: true,
          },
        },
      },
    })

    // Create notification for meeting organizer
    await db.notification.create({
      data: {
        title: 'Meeting Response',
        message: `${dbUser.name} has ${status.toLowerCase()} the meeting invitation`,
        userId: updatedAttendee.meeting.organizerId,
        type: 'MEETING_RESPONSE',
        link: `/communications?meeting=${params.meetingId}`,
      },
    })

    return NextResponse.json(updatedAttendee)
  } catch (error) {
    console.error('Error updating meeting status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 