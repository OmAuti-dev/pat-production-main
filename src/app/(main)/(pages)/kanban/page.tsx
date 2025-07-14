'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProjects } from '../projects/_actions/project'
import { getProjectTasks, updateKanbanTaskStatus, addTaskComment, updateTaskResourceUrl } from './_actions/task-actions'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Rating } from "@/components/ui/rating"
import { Link2, MessageSquare, Clock, CheckCircle2, CircleDashed } from 'lucide-react'
import { Project as BaseProject, Task as BaseTask } from '@/types'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type Comment = {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    profileImage: string | null
  }
}

type Task = BaseTask & {
  assignedTo: {
    name: string | null
    profileImage: string | null
  }
  project: {
    id: string
    name: string
  }
  comments: Comment[]
  resourceUrl?: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
}

type Project = BaseProject & {
  client: {
    name: string | null
  }
}

const statusColumns = [
  { 
    id: 'PENDING', 
    title: 'Pending', 
    icon: CircleDashed,
    description: 'Tasks that need to be started',
    color: 'bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/30',
    textColor: 'text-yellow-500'
  },
  { 
    id: 'IN_PROGRESS', 
    title: 'In Progress', 
    icon: Clock,
    description: 'Tasks currently being worked on',
    color: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/30',
    textColor: 'text-blue-500'
  },
  { 
    id: 'DONE', 
    title: 'Completed', 
    icon: CheckCircle2,
    description: 'Tasks that have been completed',
    color: 'bg-green-500/10 border-green-500/20 hover:border-green-500/30',
    textColor: 'text-green-500'
  }
]

const priorityColorMap: Record<string, string> = {
  'LOW': 'bg-green-500/20 text-green-500',
  'MEDIUM': 'bg-yellow-500/20 text-yellow-500',
  'HIGH': 'bg-red-500/20 text-red-500'
}

interface TaskDetailsProps {
  task: Task
  onAddComment: (taskId: string, content: string, rating?: number) => Promise<void>
  onAddResourceUrl: (taskId: string, url: string) => Promise<void>
}

function TaskDetails({ task, onAddComment, onAddResourceUrl }: TaskDetailsProps) {
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number>()
  const [resourceUrl, setResourceUrl] = useState('')

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return
    await onAddComment(task.id, comment, rating)
    setComment('')
    setRating(undefined)
  }

  const handleResourceUrlSubmit = async () => {
    if (!resourceUrl.trim()) return
    await onAddResourceUrl(task.id, resourceUrl)
    setResourceUrl('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Task Details</h3>
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Project:</span> {task.project.name}</p>
          <p><span className="text-muted-foreground">Assigned to:</span> {task.assignedTo.name || 'Unassigned'}</p>
          <p><span className="text-muted-foreground">Status:</span> {task.status}</p>
          <p><span className="text-muted-foreground">Priority:</span> {task.priority}</p>
          <p><span className="text-muted-foreground">Deadline:</span> {task.deadline ? format(task.deadline, 'PPP') : 'No deadline'}</p>
          {task.resourceUrl && (
            <p>
              <span className="text-muted-foreground">Resource:</span>{' '}
              <a 
                href={task.resourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Resource
              </a>
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Comments</h3>
        <div className="space-y-4">
          {task.comments.map((comment) => (
            <div key={comment.id} className="bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user.profileImage || ''} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(comment.createdAt), 'PPp')}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Add Comment</h3>
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <Rating value={rating} onChange={setRating} />
            <Button onClick={handleCommentSubmit}>Add Comment</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects()
        setProjects(projectsData.map((project: any) => ({
          ...project,
          client: {
            name: project.client?.name || null
          }
        })))
      } catch (error) {
        console.error('Failed to load projects:', error)
        toast.error('Failed to load projects')
      }
    }

    loadProjects()
  }, [])

  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedProject) {
        setTasks([])
        return
      }

      try {
        const result = await getProjectTasks(selectedProject)
        if (result.success && result.tasks) {
          setTasks(result.tasks.map((task: any) => ({
            ...task,
            status: task.status === 'TODO' ? 'PENDING' : task.status || 'PENDING',
            assignedTo: {
              name: task.assignedTo?.name || null,
              profileImage: task.assignedTo?.profileImage || null
            },
            project: {
              id: task.project?.id || '',
              name: task.project?.name || ''
            },
            comments: (task.project?.comments || []).filter((comment: any) => comment !== undefined)
          })))
        } else {
          toast.error(result.error || 'Failed to load tasks')
          setTasks([])
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)
        toast.error('Failed to load tasks')
      }
    }

    loadTasks()
  }, [selectedProject])

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceStatus = result.source.droppableId
    const destinationStatus = result.destination.droppableId
    
    if (sourceStatus === destinationStatus) return

    const taskId = result.draggableId
    const task = tasks.find(t => t.id === taskId)
    
    if (!task) return

    // Update task status locally without persisting to DB
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, status: destinationStatus }
          : t
      )
    )

    toast.success(`Task moved to ${destinationStatus.toLowerCase().replace('_', ' ')}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <Select
            value={selectedProject}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {statusColumns.map((column) => {
            const Icon = column.icon
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-lg border ${column.color}`}
                  >
                    <div className="p-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${column.textColor}`} />
                        <h3 className="font-semibold">{column.title}</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {getTasksByStatus(column.id).length}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {column.description}
                      </p>
                    </div>
                    <div className="p-4 flex-1 space-y-4">
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="group"
                            >
                              <Card className="border border-border/50 hover:border-border transition-colors">
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium line-clamp-2">
                                      {task.title}
                                    </h4>
                                    <Badge
                                      className={priorityColorMap[task.priority]}
                                    >
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      {task.assignedTo?.name && (
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={task.assignedTo.profileImage || ''} />
                                          <AvatarFallback>
                                            {task.assignedTo.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      <span className="text-muted-foreground">
                                        {task.deadline ? format(new Date(task.deadline), 'MMM d') : 'No deadline'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                        onClick={() => {
                                          setSelectedTask(task)
                                          setIsTaskDetailsOpen(true)
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      {selectedTask && (
        <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
          <DialogContent className="max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <TaskDetails
              task={selectedTask}
              onAddComment={async (taskId, content, rating) => {
                // Handle comment addition
                setIsTaskDetailsOpen(false)
              }}
              onAddResourceUrl={async (taskId, url) => {
                // Handle resource URL addition
                setIsTaskDetailsOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 