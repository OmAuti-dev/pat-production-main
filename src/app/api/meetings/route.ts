import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
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

    const meetings = await db.meeting.findMany({
      where: {
        OR: [
          { organizerId: dbUser.id },
          {
            attendees: {
              some: {
                userId: dbUser.id,
              },
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
    const { title, description, projectId, startTime, endTime, link, location } = data

    // Create the meeting
    const meeting = await db.meeting.create({
      data: {
        title,
        description,
        projectId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        link,
        location,
        organizerId: dbUser.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Get project members to add as attendees
    const projectMembers = await db.user.findMany({
      where: {
        OR: [
          { managedProjects: { some: { id: projectId } } },
          { clientProjects: { some: { id: projectId } } },
        ],
      },
    })

    // Add attendees
    await Promise.all(
      projectMembers.map((member) =>
        db.meetingAttendee.create({
          data: {
            meetingId: meeting.id,
            userId: member.id,
          },
        })
      )
    )

    // Create notifications for attendees
    await Promise.all(
      projectMembers.map((member) =>
        db.notification.create({
          data: {
            title: 'New Meeting Invitation',
            message: `You have been invited to a meeting: ${meeting.title}`,
            userId: member.id,
            type: 'MEETING',
            link: `/communications?meeting=${meeting.id}`,
          },
        })
      )
    )

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 