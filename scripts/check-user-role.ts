const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserRole(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        email: true,
        role: true,
        name: true
      }
    })
    
    if (user) {
      console.log('User found:')
      console.log('Email:', user.email)
      console.log('Name:', user.name)
      console.log('Current Role:', user.role)
    } else {
      console.log('No user found with that Clerk ID')
    }
  } catch (error) {
    console.error('Error checking user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get arguments from command line
const clerkId = process.argv[2]

if (!clerkId) {
  console.log('Usage: npx ts-node scripts/check-user-role.ts <clerkId>')
  process.exit(1)
}

checkUserRole(clerkId)

export {} 