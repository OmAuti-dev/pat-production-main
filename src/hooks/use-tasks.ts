'use client'

import { useState, useEffect } from 'react'
import { getEmployeeTasks } from '@/app/(main)/(pages)/dashboards/employee/_actions/get-tasks'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  deadline: string
  accepted: boolean
  createdAt: string
  updatedAt: string
  resourceUrl?: string
  assignedBy: string
  assignedToId?: string
  projectId: string
  Project: {
    id: string
    name: string
  } | null
}

interface UseTasksReturn {
  data: Task[] | null
  loading: boolean
  error: Error | null
  fetchTasks: () => Promise<void>
}

export function useTasks(): UseTasksReturn {
  const [data, setData] = useState<Task[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await getEmployeeTasks()
      if (response.success && response.tasks) {
        setData(response.tasks)
      } else {
        throw new Error(response.error || 'Failed to fetch tasks')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return { data, loading, error, fetchTasks }
}