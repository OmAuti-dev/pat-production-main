'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjects, useTasks } from '@/hooks'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
)

export default function TeamLeaderDashboard() {
  const { data: projects } = useProjects()
  const { data: tasks } = useTasks()

  const tasksByStatus = tasks?.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {}) || {}

  const taskStatusData = {
    labels: Object.keys(tasksByStatus),
    datasets: [
      {
        data: Object.values(tasksByStatus),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
      },
    ],
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Team Leader Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex justify-center">
            <Doughnut data={taskStatusData} options={{ maintainAspectRatio: false }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 