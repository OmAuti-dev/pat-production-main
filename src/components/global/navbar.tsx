'use client'

import Link from 'next/link'
import React from 'react'
import { MenuIcon } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const Navbar = () => {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const handleDashboardClick = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    // Fetch user role from API
    try {
      const response = await fetch('/api/user/role')
      const data = await response.json()
      
      if (data.role) {
        router.push(`/${data.role.toLowerCase()}/dashboard`)
      } else {
        router.push('/dashboard') // Fallback to default dashboard
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      router.push('/dashboard') // Fallback to default dashboard
    }
  }

  return (
    <header className="fixed right-0 left-0 top-0 h-14 px-6 bg-black/40 backdrop-blur-lg z-[100] flex items-center border-b border-neutral-900 justify-between">
      <aside className="flex items-center gap-2">
        <Link href="/" className="text-3xl font-bold">PAT</Link>
      </aside>
      <nav className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block">
        <ul className="flex items-center gap-4 list-none">
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Products</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Clients</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Resources</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">Enterprise</Link>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-4">
        <Button
          onClick={handleDashboardClick}
          className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {user ? 'Dashboard' : 'Get Started'}
          </span>
        </Button>
        {user ? <UserButton afterSignOutUrl="/" /> : null}
        <MenuIcon className="md:hidden cursor-pointer text-gray-300 hover:text-white transition-colors" />
      </aside>
    </header>
  )
}

export default Navbar
