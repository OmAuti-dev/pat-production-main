'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function AuthSync() {
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn) {
        try {
          console.log('Attempting to sync user to database...')
          const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to sync user:', error)
          } else {
            const result = await response.json()
            console.log('User sync successful:', result)
          }
        } catch (error) {
          console.error('Error syncing user:', error)
        }
      }
    }

    if (isLoaded) {
      syncUser()
    }
  }, [isSignedIn, isLoaded])

  return null
} 