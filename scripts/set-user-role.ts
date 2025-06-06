import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setUserRole(clerkId: string, role: 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE' | 'CLIENT') {
  try {
    const user = await prisma.user.update({
      where: { clerkId },
      data: { role }
    })
    console.log(`Successfully updated user ${user.email} to role: ${role}`)
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get arguments from command line
const clerkId = process.argv[2]
const role = process.argv[3] as 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE' | 'CLIENT'

if (!clerkId || !role) {
  console.log('Usage: npx ts-node scripts/set-user-role.ts <clerkId> <role>')
  console.log('Available roles: MANAGER, TEAM_LEADER, EMPLOYEE, CLIENT')
  process.exit(1)
}

setUserRole(clerkId, role) 