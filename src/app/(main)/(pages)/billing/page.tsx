import React from 'react'
import BillingDashboard from './_components/billing-dashboard'
import PageHeader from '@/components/global/page-header'

const Billing = () => {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Billing" />
      <BillingDashboard />
    </div>
  )
}

export default Billing
