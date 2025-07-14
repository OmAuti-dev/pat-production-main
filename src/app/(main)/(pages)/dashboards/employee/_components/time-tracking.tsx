'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Play, Pause, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { startTimeTracking, stopTimeTracking, getActiveTimeEntry } from '../_actions/time-tracking'
import type { Task } from '../types'

interface TimeTrackingProps {
  task: Task
  onTimeUpdate?: () => void
}

export function TimeTracking({ task, onTimeUpdate }: TimeTrackingProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [activeTimeEntry, setActiveTimeEntry] = useState<{
    id: string
    startTime: string
    description?: string | null
  } | null>(null)
  const [description, setDescription] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTracking])

  useEffect(() => {
    const checkActiveTimeEntry = async () => {
      try {
        const result = await getActiveTimeEntry(task.id)
        if (result.success && result.timeEntry) {
          setActiveTimeEntry(result.timeEntry)
          setIsTracking(true)
          const startTime = new Date(result.timeEntry.startTime).getTime()
          const now = Date.now()
          setElapsedTime(Math.floor((now - startTime) / 1000))
        }
      } catch (error) {
        console.error('Error checking active time entry:', error)
      }
    }

    checkActiveTimeEntry()
  }, [task.id])

  const handleStartTracking = async () => {
    try {
      const result = await startTimeTracking(task.id, description)
      if (result.success) {
        setIsTracking(true)
        setActiveTimeEntry(result.timeEntry)
        setElapsedTime(0)
        setDescription('')
        toast.success('Time tracking started')
        if (onTimeUpdate) {
          onTimeUpdate()
        }
      } else {
        toast.error(result.error || 'Failed to start time tracking')
      }
    } catch (error) {
      console.error('Error starting time tracking:', error)
      toast.error('Failed to start time tracking')
    }
  }

  const handleStopTracking = async () => {
    if (!activeTimeEntry) return

    try {
      const result = await stopTimeTracking(activeTimeEntry.id)
      if (result.success) {
        setIsTracking(false)
        setActiveTimeEntry(null)
        setElapsedTime(0)
        toast.success('Time tracking stopped')
        if (onTimeUpdate) {
          onTimeUpdate()
        }
      } else {
        toast.error(result.error || 'Failed to stop time tracking')
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error)
      toast.error('Failed to stop time tracking')
    }
  }

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isTracking ? (
            <>
              <Textarea
                placeholder="What are you working on? (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <Button onClick={handleStartTracking} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-2xl font-mono mb-2">
                  {formatElapsedTime(elapsedTime)}
                </div>
                {activeTimeEntry?.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeTimeEntry.description}
                  </p>
                )}
                <Button 
                  onClick={handleStopTracking}
                  variant="destructive"
                  className="w-full"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 