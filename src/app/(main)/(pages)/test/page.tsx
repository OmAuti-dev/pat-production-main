'use client'

import { useProjects, useTasks, useCampaigns } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect } from 'react'

export default function TestPage() {
  const { 
    data: projectsData, 
    loading: projectsLoading, 
    error: projectsError,
    fetchProjects,
    createProject
  } = useProjects()

  const { 
    data: tasksData, 
    loading: tasksLoading, 
    error: tasksError,
    fetchTasks,
    createTask
  } = useTasks()

  const { 
    data: campaignsData, 
    loading: campaignsLoading, 
    error: campaignsError,
    fetchCampaigns,
    createCampaign
  } = useCampaigns()

  useEffect(() => {
    fetchProjects()
    fetchTasks()
    fetchCampaigns()
  }, [])

  const handleCreateProject = async () => {
    try {
      await createProject({
        name: 'Test Project',
        type: 'Development'
      })
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!projectsData?.projects[0]?.id) {
      alert('Please create a project first')
      return
    }

    try {
      await createTask({
        title: 'Test Task',
        projectId: projectsData.projects[0].id
      })
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      await createCampaign({
        name: 'Test Campaign',
        openRate: 45.5,
        clickRate: 22.3,
        recipients: 1000,
        growth: 15.7
      })
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Page</h1>
      
      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Projects
            <Button onClick={handleCreateProject}>Create Test Project</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading && <p>Loading projects...</p>}
          {projectsError && <p className="text-red-500">Error: {projectsError}</p>}
          {projectsData && (
            <div className="space-y-2">
              {projectsData.projects.map(project => (
                <div key={project.id} className="p-2 border rounded">
                  <p>Name: {project.name}</p>
                  <p>Type: {project.type}</p>
                  <p>Progress: {project.progress}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Tasks
            <Button onClick={handleCreateTask}>Create Test Task</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading && <p>Loading tasks...</p>}
          {tasksError && <p className="text-red-500">Error: {tasksError}</p>}
          {tasksData && (
            <div className="space-y-2">
              {tasksData.tasks.map(task => (
                <div key={task.id} className="p-2 border rounded">
                  <p>Title: {task.title}</p>
                  <p>Status: {task.status}</p>
                  <p>Priority: {task.priority}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Campaigns
            <Button onClick={handleCreateCampaign}>Create Test Campaign</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading && <p>Loading campaigns...</p>}
          {campaignsError && <p className="text-red-500">Error: {campaignsError}</p>}
          {campaignsData && (
            <div className="space-y-2">
              {campaignsData.campaigns.map(campaign => (
                <div key={campaign.id} className="p-2 border rounded">
                  <p>Name: {campaign.name}</p>
                  <p>Open Rate: {campaign.openRate}%</p>
                  <p>Click Rate: {campaign.clickRate}%</p>
                  <p>Recipients: {campaign.recipients}</p>
                  <p>Growth: {campaign.growth}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 