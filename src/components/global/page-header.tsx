import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
  className?: string
}

const PageHeader = ({ title, children, className }: PageHeaderProps) => {
  return (
    <div className={cn(
      "sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg",
      className
    )}>
      <h1 className="text-4xl font-semibold">{title}</h1>
      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default PageHeader 