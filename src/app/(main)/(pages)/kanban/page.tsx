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
import { Link2, MessageSquare } from 'lucide-react'
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
}

type Project = BaseProject & {
  client: {
    name: string | null
  }
}

const statusColumns = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Completed' }
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
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [commentContent, setCommentContent] = useState('')
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

    const loadTasks = async () => {
      try {
        const result = await getProjectTasks(selectedProject)
        if (result.success && result.tasks) {
          setTasks(result.tasks.map((task: any) => ({
            ...task,
            status: task.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
            assignedTo: {
              name: task.assignedTo?.name || null,
              profileImage: task.assignedTo?.profileImage || null
            },
            project: {
              id: task.project?.id || '',
              name: task.project?.name || ''
            },
            comments: task.comments || [],
            resourceUrl: task.resourceUrl || undefined
          })))
        } else {
          toast.error(result.error || 'Failed to load tasks')
          setTasks([])
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)
        toast.error('Failed to load tasks')
        setTasks([])
      }
    }

    loadProjects()
    loadTasks()
  }, [selectedProject])

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId)
    setIsTaskDetailsOpen(false)
    setIsAddingComment(false)
    setCommentContent('')
    setSelectedTask(null)
    setTasks([])
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const updatedTasks = Array.from(tasks)
    const [reorderedTask] = updatedTasks.splice(result.source.index, 1)
    updatedTasks.splice(result.destination.index, 0, {
      ...reorderedTask,
      status: result.destination.droppableId as 'TODO' | 'IN_PROGRESS' | 'DONE'
    })

    setTasks(updatedTasks)

    try {
      await updateKanbanTaskStatus(reorderedTask.id, result.destination.droppableId)
      router.refresh()
      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleAddComment = async () => {
    if (!selectedTask || !commentContent.trim()) return

    setIsAddingComment(true)

    try {
      const result = await addTaskComment(selectedTask.id, commentContent)
      if (result.success) {
        setTasks(tasks.map(task =>
          task.id === selectedTask.id
            ? {
                ...task,
                comments: [result.comment, ...task.comments]
              }
            : task
        ))
        setCommentContent('')
        toast.success('Comment added successfully')
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleAddResourceUrl = async (taskId: string, url: string) => {
    try {
      const result = await updateTaskResourceUrl(taskId, url)
      if (result.success) {
        setTasks(tasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                resourceUrl: url
              }
            : task
        ))
        toast.success('Resource URL added successfully')
      } else {
        toast.error(result.error || 'Failed to add resource URL')
      }
    } catch (error) {
      console.error('Error adding resource URL:', error)
      toast.error('Failed to add resource URL')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Kanban Board</h1>
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

      {tasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Select a project to view its tasks
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            {statusColumns.map(column => (
              <Card key={column.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {column.title}
                    <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {getTasksByStatus(column.id).length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={column.id}>
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {getTasksByStatus(column.id).map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="bg-card border rounded-lg p-4 space-y-2 cursor-grab hover:shadow-md transition-shadow"
                                  >
                                    <h3 className="font-medium">{task.title}</h3>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                      <span>Assigned to: {task.assignedTo.name || 'Unassigned'}</span>
                                      <div className="flex items-center gap-2">
                                        {task.resourceUrl && (
                                          <Link2 className="h-4 w-4" />
                                        )}
                                        {task.comments.length ? (
                                          <div className="flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{task.comments.length}</span>
                                          </div>
                                        ) : null}
                                        <Badge className={priorityColorMap[task.priority] || 'bg-gray-500/20 text-gray-500'}>
                                          {task.priority}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{task.title}</DialogTitle>
                                  </DialogHeader>
                                  <TaskDetails
                                    task={task}
                                    onAddComment={handleAddComment}
                                    onAddResourceUrl={handleAddResourceUrl}
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
} 