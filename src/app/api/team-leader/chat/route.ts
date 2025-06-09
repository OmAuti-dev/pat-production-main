import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type TeamLeaderWithComments = Prisma.UserGetPayload<{
  include: {
    leadingTeams: {
      include: {
        tasks: {
          include: {
            comments: {
              include: {
                user: true
              }
              orderBy: {
                createdAt: 'desc'
              }
              take: 50
            }
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

    // Get team leader's teams and their chat messages
    const teamLeader = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      include: {
        leadingTeams: {
          include: {
            tasks: {
              include: {
                comments: {
                  include: {
                    user: true
                  },
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 50
                }
              }
            }
          }
        }
      }
    }) as TeamLeaderWithComments | null

    if (!teamLeader) {
      return new NextResponse('Team leader not found', { status: 404 })
    }

    // Flatten comments from all teams' tasks and format them as chat messages
    const messages: {
      id: string
      message: string
      timestamp: Date
      sender: {
        name: string
        profileImage: string | null
      }
    }[] = []

    teamLeader.leadingTeams.forEach(team => {
      team.tasks.forEach(task => {
        task.comments.forEach(comment => {
          messages.push({
            id: comment.id,
            message: comment.content,
            timestamp: comment.createdAt,
            sender: {
              name: comment.user.name || 'Unknown User',
              profileImage: comment.user.profileImage
            }
          })
        })
      })
    })

    // Sort messages by timestamp
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 