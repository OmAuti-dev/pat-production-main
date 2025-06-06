'use client'

import { useBilling } from '@/providers/billing-provider'
import React from 'react'
import { SubscriptionCard } from './subscription-card'
import CreditTracker from './creadits-tracker'

type Props = {}

const BillingDashboard = (props: Props) => {
  const { credits, tier } = useBilling()

  return (
    <>
      <div className="flex gap-5 p-6">
        <SubscriptionCard tier={tier} />
      </div>
      <CreditTracker
        tier={tier}
        credits={parseInt(credits)}
      />
    </>
  )
}

export default BillingDashboard
