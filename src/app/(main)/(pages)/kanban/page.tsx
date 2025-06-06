'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProjects } from '../projects/_actions/project'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  assignedTo: {
    name: string
  }
}

type Project = {
  id: string
  name: string
  tasks: Task[]
}

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects()
        setProjects(projectsData)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
    loadProjects()
  }, [])

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId)
    // Load tasks for selected project
    // const projectTasks = await getProjectTasks(projectId)
    // setTasks(projectTasks)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">Kanban Board</h1>
        <Select value={selectedProject} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProject ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TODO Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                To Do
                <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {getTasksByStatus('TODO').length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getTasksByStatus('TODO').map(task => (
                <div
                  key={task.id}
                  className="bg-card border rounded-lg p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Assigned to: {task.assignedTo.name}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* In Progress Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                In Progress
                <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {getTasksByStatus('IN_PROGRESS').length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getTasksByStatus('IN_PROGRESS').map(task => (
                <div
                  key={task.id}
                  className="bg-card border rounded-lg p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Assigned to: {task.assignedTo.name}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Completed Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Completed
                <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {getTasksByStatus('COMPLETED').length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getTasksByStatus('COMPLETED').map(task => (
                <div
                  key={task.id}
                  className="bg-card border rounded-lg p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Assigned to: {task.assignedTo.name}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          Select a project to view its tasks
        </div>
      )}
    </div>
  )
} 