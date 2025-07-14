'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { userId } = useAuth()

  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data: Notification[] = await response.json()
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.isRead).length)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const channelName = `${CHANNELS.NOTIFICATIONS}-${userId}`
    try {
      const channel = pusherClient.subscribe(channelName)

      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        toast.info(notification.title, {
          description: notification.message,
        })
      }

      channel.bind(EVENTS.NEW_NOTIFICATION, handleNewNotification)

      return () => {
        channel.unbind(EVENTS.NEW_NOTIFICATION, handleNewNotification)
        pusherClient.unsubscribe(channelName)
      }
    } catch (error) {
      console.error('Failed to subscribe to Pusher channel:', error)
    }
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => (prev > 0 ? prev - 1 : 0))

      try {
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
        })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
  }, [notifications])


  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'relative'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4">
          <h4 className="text-sm font-medium leading-none">Notifications</h4>
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No new notifications
            </p>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                <div
                  className={cn(
                    'p-4 text-sm cursor-pointer',
                    !notification.isRead && 'bg-accent/50'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="font-semibold">{notification.title}</div>
                  <p className="text-muted-foreground">
                    {notification.message}
                  </p>
                  {notification.link && (
                    <Link href={notification.link} className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                      View details
                    </Link>
                  )}
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 