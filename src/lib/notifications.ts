import { db } from '@/lib/db'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export type NotificationType = 
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_ACCEPTED'
  | 'TASK_DUE_TODAY'
  | 'TASK_RESCHEDULED'
  | 'PROJECT_UPDATED';

interface NotificationAction {
  label: string;
  href: string;
}

interface CreateNotificationParams {
  userId: string  // This should be clerkId
  title: string
  message: string
  type: NotificationType
  action?: NotificationAction
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  action
}: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        link: action?.href,
        user: {
          connect: { clerkId: userId }
        }
      }
    })

    const channel = `${CHANNELS.NOTIFICATIONS}-${userId}`
    await pusherServer.trigger(channel, EVENTS.NEW_NOTIFICATION, notification)

    return { success: true, notification }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}

export async function createTaskAssignedNotification(
  assigneeClerkId: string,
  taskTitle: string,
  taskId: string,
  assignerName: string
) {
  return createNotification({
    userId: assigneeClerkId,
    title: 'New Task Assignment',
    message: `A new task "${taskTitle}" has been assigned to you by ${assignerName}`,
    type: 'TASK_ASSIGNED',
    action: {
      label: 'View Task',
      href: `/dashboards/employee?taskId=${taskId}`
    }
  })
}

export async function createTaskCompletedNotification(
  managerClerkId: string,
  taskTitle: string,
  completedByName: string
) {
  return createNotification({
    userId: managerClerkId,
    title: 'Task Completed',
    message: `Task "${taskTitle}" has been completed by ${completedByName}`,
    type: 'TASK_COMPLETED'
  })
}

export async function createTaskAcceptedNotification(
  managerClerkId: string,
  taskTitle: string,
  acceptedByName: string
) {
  return createNotification({
    userId: managerClerkId,
    title: 'Task Accepted',
    message: `Task "${taskTitle}" has been accepted by ${acceptedByName}`,
    type: 'TASK_ACCEPTED'
  })
}

export async function createTaskDueTodayNotification(
  assigneeClerkId: string,
  taskTitle: string,
  taskId: string
) {
  return createNotification({
    userId: assigneeClerkId,
    title: 'Task Due Today',
    message: `Your task "${taskTitle}" is due today`,
    type: 'TASK_DUE_TODAY',
    action: {
      label: 'View Task',
      href: `/dashboards/employee?taskId=${taskId}`
    }
  })
}

export async function createTaskRescheduledNotification(
  assigneeClerkId: string,
  taskTitle: string,
  taskId: string,
  newDeadline: Date
) {
  return createNotification({
    userId: assigneeClerkId,
    title: 'Task Rescheduled',
    message: `Task "${taskTitle}" has been rescheduled to ${newDeadline.toLocaleDateString()}`,
    type: 'TASK_RESCHEDULED',
    action: {
      label: 'View Task',
      href: `/dashboards/employee?taskId=${taskId}`
    }
  })
}

// Example usage:
// When a task is assigned:
// await createNotification({
//   userId: assignedUserId,
//   title: 'New Task Assigned',
//   message: `You have been assigned to "${taskTitle}"`,
//   type: 'TASK'
// })

// When a project deadline is approaching:
// await createNotification({
//   userId: projectManagerId,
//   title: 'Project Deadline Approaching',
//   message: `Project "${projectName}" is due in 2 days`,
//   type: 'PROJECT'
// })

// When added to a team:
// await createNotification({
//   userId: newMemberId,
//   title: 'Added to Team',
//   message: `You have been added to team "${teamName}"`,
//   type: 'TEAM'
// }) 