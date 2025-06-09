'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from './_components/project-card'
import { getDashboardData } from './actions'
import { useRealTime } from '@/hooks/use-real-time'
import { Skeleton } from '@/components/ui/skeleton'
import type { Project, Task } from '@/app/(main)/(pages)/manager/dashboard/types'
import type { ProjectMember } from '@/app/(main)/(pages)/manager/dashboard/actions'
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
    team: {
      id: string
      name: string
      members: Array<{
        id: string
        joinedAt: Date
        role: string
        userId: string
        teamId: string
        user: {
          id: string
          name: string
          profileImage: string | null
          role: Role
        }
      }>
    } | null
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

  // Keep track of projects, tasks, and members for real-time updates
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])

  // Subscribe to real-time updates
  useRealTime({
    projects,
    tasks,
    members,
    setProjects,
    setTasks,
    setMembers
  })

  const loadData = async () => {
    try {
      const data = await getDashboardData()
      setDashboardData(data)
      
      // Update real-time state
      const transformedProjects: Project[] = data.projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        managerId: '', // We don't have this info
        clientId: data.user.id,
        teamId: p.team?.id || null,
        team: p.team ? {
          id: p.team.id,
          name: p.team.name,
          members: p.team.members.map(m => ({
            user: {
              clerkId: m.user.id,
              name: m.user.name,
              profileImage: m.user.profileImage,
              role: m.user.role,
              assignedTasks: p.tasks.filter(t => t.status === 'DONE')
            }
          }))
        } : undefined,
        progress: p.progress
      }))
      setProjects(transformedProjects)

      const transformedTasks: Task[] = data.projects.flatMap(p => 
        p.tasks.map(task => ({
          id: task.id,
          title: '', // We don't have this info from the team member
          description: null,
          status: task.status as Task['status'],
          priority: 'MEDIUM', // Default
          deadline: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          creatorId: p.team?.members[0]?.user.id || '',
          assignedToId: p.team?.members[0]?.user.id || '',
          projectId: p.id,
          assignedTo: p.team?.members[0] ? {
            id: p.team.members[0].user.id,
            name: p.team.members[0].user.name,
            profileImage: p.team.members[0].user.profileImage,
            role: p.team.members[0].user.role
          } : undefined,
          project: {
            id: p.id,
            name: p.name
          }
        }))
      )
      setTasks(transformedTasks)

      const transformedMembers: ProjectMember[] = data.projects.flatMap(p => 
        p.team?.members.map(member => ({
          id: member.user.id,
          name: member.user.name,
          profileImage: member.user.profileImage,
          role: member.user.role,
          assignedTasks: p.tasks.length,
          completedTasks: p.tasks.filter(t => t.status === 'DONE').length
        })) || []
      )
      setMembers(transformedMembers)
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
        <h1 className="text-3xl font-bold">Welcome back, {dashboardData.user.firstName}!</h1>
        <p className="text-muted-foreground mt-2">Here&apos;s what&apos;s happening with your projects.</p>
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
          {dashboardData.projects.map((project) => (
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