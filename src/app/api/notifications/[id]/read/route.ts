import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await db.notification.update({
      where: {
        id: params.id,
        userId: userId
      },
      data: {
        isRead: true
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[NOTIFICATION_MARK_READ]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 