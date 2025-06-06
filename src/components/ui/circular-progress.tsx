import React from 'react'
import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number
  color?: 'blue' | 'pink' | 'yellow'
  label?: string
  className?: string
}

export function CircularProgress({ value, color = 'blue', label, className }: CircularProgressProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const colorClasses = {
    blue: 'stroke-blue-500',
    pink: 'stroke-pink-500',
    yellow: 'stroke-yellow-500'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        {/* Background circle */}
        <svg className="w-32 h-32 -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={colorClasses[color]}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}%</span>
        </div>
      </div>
      {label && (
        <div className="mt-4 text-center">
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
    </div>
  )
} 