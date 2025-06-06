import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const minOpenRate = searchParams.get('minOpenRate')
    const minClickRate = searchParams.get('minClickRate')

    const where = {
      userId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' }
      }),
      ...(minOpenRate && {
        openRate: { gte: parseFloat(minOpenRate) }
      }),
      ...(minClickRate && {
        clickRate: { gte: parseFloat(minClickRate) }
      })
    }

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.campaign.count({ where })
    ])

    return NextResponse.json({
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[CAMPAIGNS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { name, openRate, clickRate, recipients, growth } = body

    if (!name || typeof openRate !== 'number' || typeof clickRate !== 'number' || typeof recipients !== 'number' || typeof growth !== 'number') {
      return new NextResponse('Missing or invalid required fields', { status: 400 })
    }

    const campaign = await db.campaign.create({
      data: {
        name,
        openRate,
        clickRate,
        recipients,
        growth,
        userId,
        date: new Date()
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('[CAMPAIGNS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { id, name, openRate, clickRate, recipients, growth } = body

    if (!id) {
      return new NextResponse('Campaign ID is required', { status: 400 })
    }

    const campaign = await db.campaign.findUnique({
      where: { id }
    })

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 })
    }

    if (campaign.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(typeof openRate === 'number' && { openRate }),
        ...(typeof clickRate === 'number' && { clickRate }),
        ...(typeof recipients === 'number' && { recipients }),
        ...(typeof growth === 'number' && { growth })
      }
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('[CAMPAIGNS_PUT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('id')

    if (!campaignId) {
      return new NextResponse('Campaign ID is required', { status: 400 })
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 })
    }

    if (campaign.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    await db.campaign.delete({
      where: { id: campaignId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[CAMPAIGNS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 