const { PrismaClient } = require('@prisma/client')
const { clerkClient } = require('@clerk/nextjs')
require('dotenv').config()

const prisma = new PrismaClient()

async function syncRoles() {
  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        clerkId: true,
        role: true,
        email: true
      }
    })

    console.log('Found users:', users.length)

    // Update each user's metadata in Clerk
    for (const user of users) {
      try {
        await clerkClient.users.updateUser(user.clerkId, {
          publicMetadata: {
            role: user.role
          }
        })
        console.log(`Updated role for ${user.email} to ${user.role}`)
      } catch (error) {
        console.error(`Failed to update user ${user.email}:`, error)
      }
    }

    console.log('Role sync completed')
  } catch (error) {
    console.error('Error syncing roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncRoles() 