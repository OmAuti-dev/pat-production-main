'use client'
import React from 'react'

type Props = {
  tier: string
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const SubscriptionCard = ({ tier }: Props) => {
  const tiers = [
    {
      name: 'Free',
      description: 'Get started with full automation capabilities.',
      credits: 'Unlimited',
      price: 'Free'
    },
    {
      name: 'Pro',
      description: 'Enhanced features for growing teams.',
      credits: 'Unlimited',
      price: 'Free'
    },
    {
      name: 'Unlimited',
      description: 'All features unlocked for your organization.',
      credits: 'Unlimited',
      price: 'Free'
    }
  ]

  return (
    <section className="flex w-full justify-center md:flex-row flex-col gap-6">
      {tiers.map((product) => (
        <Card
          className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5"
          key={product.name}
        >
          <CardHeader>
            <CardTitle className="text-xl">{product.name}</CardTitle>
            <CardDescription>{product.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credits</span>
              <span className="text-sm font-medium">{product.credits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-lg font-bold">{product.price}</span>
            </div>
            <div className="px-3 py-1.5 text-sm border rounded-full text-center bg-card">
              {product.name === tier ? 'Current Plan' : 'Available'}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
