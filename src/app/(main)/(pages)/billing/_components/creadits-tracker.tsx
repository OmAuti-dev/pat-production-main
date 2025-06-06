import React from 'react'
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type Props = {
  credits: number | string
  tier: string
}

const CreditTracker = ({ credits, tier }: Props) => {
  return (
    <div className="p-6">
      <Card className="p-6">
        <CardContent className="flex flex-col gap-6">
          <CardTitle className="font-light">Credit Tracker</CardTitle>
          <Progress
            value={100}
            className="w-full"
          />
          <div className="flex justify-end">
            <p>Unlimited Credits Available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreditTracker
