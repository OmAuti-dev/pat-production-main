import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: {
        user: {
          clerkId: userId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 