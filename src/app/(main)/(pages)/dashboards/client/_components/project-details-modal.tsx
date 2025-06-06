'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addProjectComment, getProjectComments, type Comment } from '../actions'
import { useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, StarIcon } from 'lucide-react'
import { format } from 'date-fns'

interface ProjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    title: string
    category: string
    description: string
    progress: number
    status: string
    startDate: string
    endDate: string
    memberCount: number
  }
}

export function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, project.id])

  const loadComments = async () => {
    try {
      const projectComments = await getProjectComments(project.id)
      setComments(projectComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const comment = await addProjectComment(project.id, newComment, rating || undefined)
      setComments(prev => [comment, ...prev])
      setNewComment('')
      setRating(0)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle className="text-foreground">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Project Overview</h3>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-foreground">Category</h4>
                <p className="text-sm text-muted-foreground">{project.category}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Status</h4>
                <p className="text-sm text-muted-foreground">{project.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Start Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(project.startDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">End Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(project.endDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Project Comments</h3>
            
            {/* Add Comment */}
            <div className="space-y-4">
              <Textarea
                placeholder="Add your feedback or comments about this project..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-background text-foreground"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-muted-foreground hover:text-yellow-400 transition-colors"
                    >
                      {star <= rating ? (
                        <StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={!newComment.trim() || isSubmitting}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mt-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 p-4 rounded-lg border dark:border-gray-800 bg-card">
                  <Avatar>
                    <AvatarImage src={comment.user.profileImage || undefined} />
                    <AvatarFallback>
                      {comment.user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{comment.user.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 