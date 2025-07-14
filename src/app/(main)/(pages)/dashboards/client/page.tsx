'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from './_components/project-card'
import { getDashboardData } from './actions'
import { useRealTime } from '@/hooks/use-real-time'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@prisma/client'

interface DashboardData {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  }
  projects: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    progress: number
    tasks: {
      id: string
      status: string
    }[]
  }[]
  stats: {
    totalProjects: number
    inProgressProjects: number
    completedProjects: number
    onHoldProjects: number
  }
}

export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>

        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {dashboardData.user.firstName || 'Client'}</h1>
        <p className="text-muted-foreground">Here's an overview of your projects</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="font-semibold">Total Projects</h3>
          <p className="text-3xl">{dashboardData.stats.totalProjects}</p>
        </div>
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="font-semibold">In Progress</h3>
          <p className="text-3xl">{dashboardData.stats.inProgressProjects}</p>
        </div>
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="font-semibold">Completed</h3>
          <p className="text-3xl">{dashboardData.stats.completedProjects}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
} 