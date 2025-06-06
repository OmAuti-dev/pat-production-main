import { useState } from 'react'
import axios from 'axios'
import { CampaignsResponse } from '@/types'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  date: Date
  openRate: number
  clickRate: number
  recipients: number
  growth: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface UseCampaignsOptions {
  page?: number
  limit?: number
  search?: string
  minOpenRate?: number
  minClickRate?: number
}

interface UseCampaignsReturn {
  data: CampaignsResponse | null
  loading: boolean
  error: Error | null
  fetchCampaigns: () => Promise<void>
  createCampaign: (name: string, date: string) => Promise<void>
}

export const useCampaigns = (): UseCampaignsReturn => {
  const [data, setData] = useState<CampaignsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await axios.get<CampaignsResponse>('/api/campaigns')
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async (name: string, date: string) => {
    try {
      setLoading(true)
      const response = await axios.post<CampaignsResponse>('/api/campaigns', { name, date })
      setData(response.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateCampaign = async (id: string, updates: Partial<Omit<Campaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) throw new Error('Failed to update campaign')
      
      const updatedCampaign = await response.json()
      toast.success('Campaign updated successfully')
      await fetchCampaigns() // Refresh the list
      return updatedCampaign
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      toast.error('Failed to update campaign')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete campaign')
      
      toast.success('Campaign deleted successfully')
      await fetchCampaigns() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      toast.error('Failed to delete campaign')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchCampaigns, createCampaign }
} 