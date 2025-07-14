'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, FolderGit2, Plus } from 'lucide-react'
import { EditTeamDialog } from './edit-team-dialog'
import { TeamDetailsDialog } from './team-details-dialog'

interface Team {
  id: string
  name: string
  description: string | null
  leader: {
    name: string
    email: string
    role: string
  }
  members: Array<{
    id: string
    name: string
    email: string
    role: string
    skills: string[]
  }>
  projects: Array<{
    id: string
    name: string
    status: string
  }>
}

interface Employee {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
}

interface TeamListProps {
  teams: Team[]
  availableEmployees: Employee[]
  userRole: string
  userId: string
}

export function TeamList({ teams, availableEmployees, userRole, userId }: TeamListProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team)
    setIsEditDialogOpen(true)
  }

  const handleViewTeamDetails = (team: Team) => {
    setSelectedTeam(team)
    setIsDetailsDialogOpen(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <Card 
          key={team.id}
          className="hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => handleViewTeamDetails(team)}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{team.name}</span>
              {(userRole === 'MANAGER' || team.leader.id === userId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditTeam(team)
                  }}
                >
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {team.description || 'No description'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{team.members.length} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{team.projects.length} projects</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Team Leader</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{team.leader.name}</Badge>
                  <Badge>{team.leader.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedTeam && (
        <>
          <EditTeamDialog
            team={selectedTeam}
            availableEmployees={availableEmployees}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setSelectedTeam(null)
            }}
          />
          <TeamDetailsDialog
            team={selectedTeam}
            isOpen={isDetailsDialogOpen}
            onClose={() => {
              setIsDetailsDialogOpen(false)
              setSelectedTeam(null)
            }}
          />
        </>
      )}
    </div>
  )
} 