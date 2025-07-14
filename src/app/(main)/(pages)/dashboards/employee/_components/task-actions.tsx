import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TaskActionsProps {
  taskId: string
  status: string
}

export function TaskActions({ taskId, status }: TaskActionsProps) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAccept = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}/accept`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to accept task')
      }

      toast.success('Task accepted successfully')
    } catch (error) {
      toast.error('Failed to accept task')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: declineReason })
      })

      if (!response.ok) {
        throw new Error('Failed to decline task')
      }

      toast.success('Task declined successfully')
      setShowDeclineDialog(false)
    } catch (error) {
      toast.error('Failed to decline task')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status !== 'ASSIGNED') {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
          onClick={handleAccept}
          disabled={isLoading}
        >
          <Check className="h-4 w-4 mr-2" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
          onClick={() => setShowDeclineDialog(true)}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Decline
        </Button>
      </div>

      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Task</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this task. This will be sent to the task creator.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for declining..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isLoading}
            >
              Decline Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 