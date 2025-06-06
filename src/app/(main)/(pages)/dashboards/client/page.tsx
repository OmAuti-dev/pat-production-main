'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from '@/app/(main)/(pages)/dashboards/client/_components/project-card'
import { getDashboardData } from './actions'

interface DashboardData {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  }
  projects: any[]
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

  useEffect(() => {
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

    loadData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!dashboardData) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {dashboardData.user.firstName}!</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your projects.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <div className="text-sm text-muted-foreground">Total Projects</div>
          <div className="mt-2 text-3xl font-bold">{dashboardData.stats.totalProjects}</div>
        </div>
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="mt-2 text-3xl font-bold">{dashboardData.stats.inProgressProjects}</div>
        </div>
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="mt-2 text-3xl font-bold">{dashboardData.stats.completedProjects}</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.projects.map((project: any) => (
            <ProjectCard
              key={project.id}
              {...project}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 