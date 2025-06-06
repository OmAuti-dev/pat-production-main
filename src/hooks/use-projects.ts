import { useState } from 'react'
import axios from 'axios'
import { ProjectsResponse } from '@/types'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  type: string
  progress: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface UseProjectsOptions {
  page?: number
  limit?: number
  status?: 'completed' | 'in_progress' | 'not_started'
  search?: string
}

interface UseProjectsReturn {
  data: ProjectsResponse | null
  loading: boolean
  error: Error | null
  fetchProjects: () => Promise<void>
  createProject: (name: string, type: string) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjects = (): UseProjectsReturn => {
  const [data, setData] = useState<ProjectsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await axios.get<ProjectsResponse>('/api/projects')
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, type: string) => {
    try {
      setLoading(true)
      const response = await axios.post<ProjectsResponse>('/api/projects', { name, type })
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.put<ProjectsResponse>(`/api/projects/${id}`, updates)
      setData(response.data)
      toast.success('Project updated successfully')
    } catch (err) {
      setError(err as Error)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      await axios.delete<ProjectsResponse>(`/api/projects/${id}`)
      toast.success('Project deleted successfully')
    } catch (err) {
      setError(err as Error)
      toast.error('Failed to delete project')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchProjects, createProject, updateProject, deleteProject }
} 