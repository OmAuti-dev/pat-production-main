import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type TeamLeaderWithMembers = Prisma.UserGetPayload<{
  include: {
    leadingTeams: {
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    }
  }
}>

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get team leader's teams and their members
    const teamLeader = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      include: {
        leadingTeams: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    }) as TeamLeaderWithMembers | null

    if (!teamLeader) {
      return new NextResponse('Team leader not found', { status: 404 })
    }

    // Flatten members from all teams and remove duplicates
    const membersMap = new Map()
    
    teamLeader.leadingTeams.forEach(team => {
      team.members.forEach(member => {
        if (member.user) {
          membersMap.set(member.user.id, {
            id: member.user.id,
            name: member.user.name || 'Unknown User',
            profileImage: member.user.profileImage
          })
        }
      })
    })

    const members = Array.from(membersMap.values())

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 