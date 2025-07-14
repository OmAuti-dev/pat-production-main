import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task } from '../types'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { TaskActions } from './task-actions'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {task.title}
        </CardTitle>
        <Badge
          variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}
        >
          {task.priority}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">
          {task.description}
        </div>
        {task.deadline && (
          <div className="text-xs text-muted-foreground mt-2">
            Due: {format(new Date(task.deadline), 'PPP')}
          </div>
        )}
        {task.Project && (
          <div className="text-xs text-muted-foreground mt-2">
            Project: {task.Project.name}
          </div>
        )}
        <div className="mt-4">
          <TaskActions taskId={task.id} status={task.status} />
        </div>
      </CardContent>
    </Card>
  )
} 