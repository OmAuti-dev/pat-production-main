'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
  }
  project: {
    id: string
    name: string
  }
}

export default function ProjectComments() {
  const { user } = useUser()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/comments')
      if (!response.ok) throw new Error('Failed to fetch comments')
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSending(true)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) throw new Error('Failed to send comment')
      
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error sending comment:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${comment.author.email}`} />
                <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{comment.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Project: {comment.project.name}
                  </span>
                </div>
                <p className="mt-2">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type your comment..."
          className="min-h-[80px]"
        />
        <Button type="submit" disabled={isSending || !newComment.trim()}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
} 