'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { getTaskTimeEntries } from '../_actions/time-tracking'
import type { Task } from '../types'

interface TimeReportProps {
  task: Task
}

interface TimeEntry {
  id: string
  startTime: string
  endTime: string | null
  description: string | null
  duration: number | null
}

export function TimeReport({ task }: TimeReportProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        const result = await getTaskTimeEntries(task.id)
        if (result.success) {
          setTimeEntries(result.timeEntries)
        }
      } catch (error) {
        console.error('Error loading time entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTimeEntries()
  }, [task.id])

  const totalDuration = timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0)
  }, 0)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Group time entries by day
  const entriesByDay = timeEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const day = format(new Date(entry.startTime), 'yyyy-MM-dd')
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(entry)
    return acc
  }, {})

  // Get this week's dates
  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Calculate daily totals for this week
  const weeklyData = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayEntries = entriesByDay[dayStr] || []
    const dayTotal = dayEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
    return {
      date: format(day, 'EEE'),
      total: dayTotal
    }
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Total Time</h4>
            <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">This Week</h4>
            <div className="grid grid-cols-7 gap-2">
              {weeklyData.map(({ date, total }) => (
                <div key={date} className="text-center">
                  <div className="text-xs text-muted-foreground">{date}</div>
                  <div className="mt-1 text-sm font-medium">
                    {total > 0 ? formatDuration(total) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Recent Entries</h4>
            <div className="space-y-2">
              {timeEntries.slice(0, 5).map(entry => (
                <div key={entry.id} className="text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">
                        {format(new Date(entry.startTime), 'MMM d, h:mm a')}
                      </span>
                      {entry.description && (
                        <p className="mt-1">{entry.description}</p>
                      )}
                    </div>
                    <div className="font-medium">
                      {entry.duration ? formatDuration(entry.duration) : 'In progress'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 