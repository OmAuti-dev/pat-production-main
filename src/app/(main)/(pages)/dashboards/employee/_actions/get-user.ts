'use server'

import { currentUser } from '@clerk/nextjs'

export async function getCurrentUser() {
  try {
    const user = await currentUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      publicMetadata: user.publicMetadata,
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { error: 'Failed to fetch user data' }
  }
} 