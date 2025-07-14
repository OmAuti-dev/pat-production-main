import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { TeamList } from './_components/team-list'
import { CreateTeamButton } from './_components/create-team-button'

export default async function TeamsPage() {
  const { userId: clerkId } = auth()
  if (!clerkId) return null

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { 
      id: true,
      role: true 
    }
  })

  if (!user) return null
  if (user.role !== 'MANAGER' && user.role !== 'TEAM_LEADER') {
    redirect('/dashboard')
  }

  // Fetch teams based on user role
  const teams = await db.team.findMany({
    where: user.role === 'MANAGER' 
      ? {} // Managers can see all teams
      : { leaderId: user.id }, // Team leaders can only see their teams
    include: {
      leader: {
        select: {
          name: true,
          email: true,
          role: true
        }
      },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          skills: true
        }
      },
      projects: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  })

  // Fetch available employees for team assignment
  const availableEmployees = await db.user.findMany({
    where: {
      role: {
        in: ['EMPLOYEE', 'TEAM_LEADER']
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      skills: true
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Teams</h1>
        {user.role === 'MANAGER' && (
          <CreateTeamButton availableEmployees={availableEmployees} />
        )}
      </div>
      <TeamList 
        teams={teams} 
        availableEmployees={availableEmployees}
        userRole={user.role}
        userId={user.id}
      />
    </div>
  )
} 