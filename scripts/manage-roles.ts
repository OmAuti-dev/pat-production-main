const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const command = process.argv[2]

  if (!command) {
    console.log('Usage:')
    console.log('  npm run roles list')
    console.log('  npm run roles set user@example.com MANAGER|TEAM_LEADER|EMPLOYEE|CLIENT')
    process.exit(1)
  }

  try {
    switch (command) {
      case 'list':
        const users = await prisma.user.findMany({
          select: {
            email: true,
            name: true,
            role: true
          }
        })
        console.log('\nCurrent Users and Roles:')
        console.table(users)
        break

      case 'set':
        const email = process.argv[3]
        const role = process.argv[4]
        
        if (!email || !role) {
          console.log('Usage for set command:')
          console.log('  npm run roles set user@example.com MANAGER|TEAM_LEADER|EMPLOYEE|CLIENT')
          process.exit(1)
        }

        if (!['MANAGER', 'TEAM_LEADER', 'EMPLOYEE', 'CLIENT'].includes(role)) {
          console.error('Invalid role. Must be one of: MANAGER, TEAM_LEADER, EMPLOYEE, CLIENT')
          process.exit(1)
        }

        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role },
          select: {
            email: true,
            name: true,
            role: true
          }
        })
        console.log('\nUpdated User:')
        console.table([updatedUser])
        break

      default:
        console.error('Invalid command. Use "list" or "set"')
        process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 