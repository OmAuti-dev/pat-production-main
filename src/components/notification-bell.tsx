'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface NotificationAction {
  label: string
  href: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  action?: NotificationAction
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      const data = await response.json()
      const processedNotifications = data.notifications.map((n: any) => ({
        ...n,
        action: n.action ? JSON.parse(n.action) : undefined
      }))
      setNotifications(processedNotifications)
      setUnreadCount(processedNotifications.filter((n: Notification) => !n.isRead).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to mark notification as read')
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    
    if (notification.action) {
      router.push(notification.action.href)
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'TASK_COMPLETED':
        case 'TASK_ACCEPTED':
          router.push('/manager/dashboard')
          break
        case 'PROJECT_UPDATED':
          router.push('/projects')
          break
        default:
          router.push('/dashboards/employee')
          break
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex flex-col items-start p-4 space-y-1 ${
                !notification.isRead ? 'bg-muted' : ''
              }`}
            >
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm text-muted-foreground">{notification.message}</div>
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                </div>
                {notification.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(notification.action!.href)
                    }}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 