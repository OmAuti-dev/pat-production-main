'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import ProfileForm from '@/components/forms/profile-form'

interface UserProfile {
  name: string
  email: string
  role: string
  phoneNumber: string | null
  skills: string[]
  experience: number
  resumeUrl: string | null
  tier: string | null
  credits: string | null
}

export default function SettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: '',
    phoneNumber: null,
    skills: [],
    experience: 0,
    resumeUrl: null,
    tier: null,
    credits: null
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile({
        ...data,
        name: data.name || '' // Ensure name is never null
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (values: any) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      toast.success('Profile updated successfully')
      router.refresh()
      await fetchUserProfile() // Refresh the profile data
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm user={profile} onUpdate={handleUpdate} />
        </CardContent>
      </Card>
    </div>
  )
}
