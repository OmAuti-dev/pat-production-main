'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ProjectComments from './_components/project-comments'
import MeetingsList from './_components/meetings-list'
import CreateMeetingDialog from './_components/create-meeting-dialog'

export default function CommunicationsPage() {
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communications</h1>
        <Button onClick={() => setIsCreateMeetingOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="comments" className="flex-1">Project Comments</TabsTrigger>
              <TabsTrigger value="meetings" className="flex-1">Meetings</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Project Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectComments />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="meetings">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  <MeetingsList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      <CreateMeetingDialog 
        open={isCreateMeetingOpen} 
        onOpenChange={setIsCreateMeetingOpen} 
      />
    </div>
  )
} 