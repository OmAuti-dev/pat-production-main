'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Video, MapPin, Check, X } from 'lucide-react'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  link: string | null
  location: string | null
  status: string
  project: {
    id: string
    name: string
  }
  organizer: {
    id: string
    name: string
  }
}

export default function MeetingsList() {
  const { user } = useUser()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/meetings')
      if (!response.ok) throw new Error('Failed to fetch meetings')
      const data = await response.json()
      setMeetings(data)
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMeetingStatus = async (meetingId: string, status: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update meeting status')
      fetchMeetings()
    } catch (error) {
      console.error('Error updating meeting status:', error)
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
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {meeting.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    {format(new Date(meeting.startTime), 'MMM d, h:mm a')}
                  </Badge>
                  {meeting.link && (
                    <Badge variant="secondary">
                      <Video className="h-3 w-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                  {meeting.location && (
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {meeting.location}
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-2">
                  Project: <span className="font-medium">{meeting.project.name}</span>
                </p>
                <p className="text-sm">
                  Organizer: <span className="font-medium">{meeting.organizer.name}</span>
                </p>
              </div>
              {meeting.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    onClick={() => updateMeetingStatus(meeting.id, 'ACCEPTED')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => updateMeetingStatus(meeting.id, 'DECLINED')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
} 