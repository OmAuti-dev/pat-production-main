import { CardBody, CardContainer, CardItem } from '@/components/global/3d-card'
import { HeroParallax } from '@/components/global/connect-parallax'
import { ContainerScroll } from '@/components/global/container-scroll-animation'
import { InfiniteMovingCards } from '@/components/global/infinite-moving-cards'
import { HeroSection } from '@/components/global/hero-section'
import Navbar from '@/components/global/navbar'
import { Button } from '@/components/ui/button'
import { clients, products } from '@/lib/constant'
import { CheckIcon } from 'lucide-react'
import Image from 'next/image'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role || undefined

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection isAuthenticated={!!session} userRole={userRole} />

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Everything you need to manage projects effectively
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Task Management',
                description: 'Create, assign, and track tasks with ease. Keep your team organized and focused.'
              },
              {
                title: 'Team Collaboration',
                description: 'Real-time updates and communication tools to keep everyone in sync.'
              },
              {
                title: 'Progress Tracking',
                description: 'Visual dashboards and reports to monitor project progress and team performance.'
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-lg bg-gray-900/50 border border-gray-800">
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
