import React from 'react'
import { Input } from '@/components/ui/input'
import { UserButton } from '@clerk/nextjs'
import { ModeToggle } from '@/components/global/mode-toggle'

type Props = { children: React.ReactNode }

const Layout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-4 pr-10"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <ModeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export default Layout
