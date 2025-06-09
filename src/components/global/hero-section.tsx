'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LampContainer } from './lamp'
import { Typewriter } from './typewriter'

interface HeroSectionProps {
  isAuthenticated: boolean
  userRole?: string | null
}

export const HeroSection = ({ isAuthenticated, userRole }: HeroSectionProps) => {
  const getDashboardUrl = () => {
    if (!isAuthenticated) return '/sign-in'
    if (!userRole) return '/dashboard'

    // Map roles to their dashboard paths
    const dashboardPaths: Record<string, string> = {
      'MANAGER': '/manager/dashboard',
      'TEAM_LEADER': '/dashboards/team-leader',
      'EMPLOYEE': '/dashboards/employee',
      'CLIENT': '/dashboards/client',
      'ADMIN': '/admin/dashboard'
    }

    return dashboardPaths[userRole] || '/dashboard'
  }

  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="bg-gradient-to-br from-neutral-100 to-neutral-300 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Project Management
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.5,
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="mt-4 text-center"
      >
        <div className="text-2xl md:text-4xl font-light text-neutral-300">
          Your{' '}
          <Typewriter
            words={[
              'Tasks',
              'Team',
              'Projects',
              'Goals',
              'Success'
            ]}
            className="text-purple-400 font-medium"
          />{' '}
          Automation Tool
        </div>
        <p className="mt-4 text-neutral-400 max-w-lg mx-auto text-base md:text-lg">
          Streamline your workflow, enhance team collaboration, and deliver projects on time with our powerful management platform.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link href={getDashboardUrl()}>
              <Button className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-base font-medium text-white backdrop-blur-3xl">
                  Go to Dashboard
                </span>
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-base font-medium text-white backdrop-blur-3xl">
                    Sign In
                  </span>
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-base font-medium text-white backdrop-blur-3xl">
                    Sign Up
                  </span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </LampContainer>
  )
} 