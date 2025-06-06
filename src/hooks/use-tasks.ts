import { useState } from 'react'
import axios from 'axios'
import { TasksResponse } from '@/types'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  projectId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  assignedTo: {
    name: string | null
    profileImage: string | null
  }
  Project: {
    id: string
    name: string
    type: string
    progress: number
  }
}

interface UseTasksOptions {
  page?: number
  limit?: number
  projectId?: string
  status?: string
  priority?: string
  search?: string
}

interface UseTasksReturn {
  data: TasksResponse | null
  loading: boolean
  error: Error | null
  fetchTasks: () => Promise<void>
  createTask: (title: string, projectId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH') => Promise<void>
}

export const useTasks = (): UseTasksReturn => {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await axios.get<TasksResponse>('/api/tasks')
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (title: string, projectId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    try {
      setLoading(true)
      const response = await axios.post<TasksResponse>('/api/tasks', { title, projectId, priority })
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (id: string, updates: {
    title?: string
    status?: string
    priority?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) throw new Error('Failed to update task')
      
      const updatedTask = await response.json()
      toast.success('Task updated successfully')
      await fetchTasks() // Refresh the list
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      toast.error('Failed to update task')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')
      
      toast.success('Task deleted successfully')
      await fetchTasks() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      toast.error('Failed to delete task')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchTasks, createTask, updateTask, deleteTask }
} 