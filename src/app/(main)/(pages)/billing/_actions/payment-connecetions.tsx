'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export const onPaymentDetails = async () => {
  const user = await currentUser()

  if (user) {
    const connection = await db.user.findFirst({
      where: {
        clerkId: user.id,
      },
      select: {
        tier: true,
        credits: true,
      },
    })

    if (connection) {
      // Always return unlimited credits
      return {
        tier: connection.tier,
        credits: 'Unlimited'
      }
    }

    // If no connection exists, create one with unlimited credits
    const newUser = await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName}`.trim(),
        profileImage: user.imageUrl,
        tier: 'Free',
        credits: 'Unlimited',
      },
    })

    return {
      tier: newUser.tier,
      credits: 'Unlimited',
    }
  }
}

export const updateTier = async (tier: 'Free' | 'Pro' | 'Unlimited') => {
  const user = await currentUser()

  if (user) {
    const updated = await db.user.update({
      where: {
        clerkId: user.id,
      },
      data: {
        tier,
        credits: 'Unlimited',
      },
    })

    return {
      tier: updated.tier,
      credits: 'Unlimited',
    }
  }
}
