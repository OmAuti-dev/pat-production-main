'use client'

import { useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher'
import type { Project, Task } from '@/app/(main)/(pages)/manager/dashboard/types'
import type { ProjectMember } from '@/app/(main)/(pages)/manager/dashboard/actions'

interface UseRealTimeProps {
  projects: Project[]
  tasks: Task[]
  members: ProjectMember[]
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setMembers: (members: ProjectMember[] | ((prev: ProjectMember[]) => ProjectMember[])) => void
}

// Debounce function to prevent too many toasts
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useRealTime({
  projects,
  tasks,
  members,
  setProjects,
  setTasks,
  setMembers,
}: UseRealTimeProps) {
  // Keep track of recent toasts to prevent duplicates
  const recentToasts = useRef(new Set<string>());
  const toastDebounceTime = 2000; // 2 seconds

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const key = `${message}-${Date.now()}`;
    if (!recentToasts.current.has(key)) {
      recentToasts.current.add(key);
      if (type === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
      setTimeout(() => recentToasts.current.delete(key), toastDebounceTime);
    }
  }, []);

  const debouncedToast = useCallback(
    debounce((message: string, type: 'success' | 'error' = 'success') => {
      showToast(message, type);
    }, 1000),
    []
  );

  const handleProjectUpdate = useCallback((data: any) => {
    setProjects(prev => prev.map(project => 
      project.id === data.projectId ? { ...project, ...data.updates } : project
    ))
    // Only show toast for significant updates
    if (data.updates.name || data.updates.status) {
      debouncedToast(`Project "${data.updates.name || 'Unknown'}" updated`);
    }
  }, [setProjects, debouncedToast]);

  const handleProjectCreate = useCallback((data: any) => {
    setProjects(prev => [...prev, data.project])
    debouncedToast(`New project created: ${data.project.name}`);
  }, [setProjects, debouncedToast]);

  const handleProjectDelete = useCallback((data: any) => {
    setProjects(prev => prev.filter(project => project.id !== data.projectId))
    debouncedToast('Project deleted');
  }, [setProjects, debouncedToast]);

  const handleProjectProgressUpdate = useCallback((data: any) => {
    setProjects(prev => prev.map(project => 
      project.id === data.projectId 
        ? { ...project, progress: data.progress } 
        : project
    ))
    // Don't show toast for progress updates as they might be frequent
  }, [setProjects]);

  const handleTaskCreate = useCallback((data: any) => {
    setTasks(prev => [...prev, data.task])
    debouncedToast(`New task created: ${data.task.title}`);
  }, [setTasks, debouncedToast]);

  const handleTaskUpdate = useCallback((data: any) => {
    setTasks(prev => prev.map(task => 
      task.id === data.taskId ? { ...task, ...data.updates } : task
    ))
    // Only show toast for significant updates
    if (data.updates.status || data.updates.title) {
      debouncedToast(`Task "${data.updates.title || 'Unknown'}" updated`);
    }
  }, [setTasks, debouncedToast]);

  const handleTaskDelete = useCallback((data: any) => {
    setTasks(prev => prev.filter(task => task.id !== data.taskId))
    debouncedToast('Task deleted');
  }, [setTasks, debouncedToast]);

  const handleTaskAssign = useCallback((data: any) => {
    setTasks(prev => prev.map(task => 
      task.id === data.taskId 
        ? { ...task, assignedTo: data.assignee } 
        : task
    ))
    debouncedToast(`Task assigned to ${data.assignee?.name || 'team member'}`);
  }, [setTasks, debouncedToast]);

  const handleTaskComplete = useCallback((data: any) => {
    setTasks(prev => prev.map(task => 
      task.id === data.taskId 
        ? { ...task, status: 'DONE', completed: true } 
        : task
    ))
    debouncedToast('Task completed');
  }, [setTasks, debouncedToast]);

  const handleMemberAdd = useCallback((data: any) => {
    setMembers(prev => [...prev, data.member])
    debouncedToast(`${data.member.name || 'New member'} added to the team`);
  }, [setMembers, debouncedToast]);

  const handleMemberRemove = useCallback((data: any) => {
    setMembers(prev => prev.filter(member => member.id !== data.memberId))
    debouncedToast('Team member removed');
  }, [setMembers, debouncedToast]);

  const handleMemberRoleUpdate = useCallback((data: any) => {
    setMembers(prev => prev.map(member => 
      member.id === data.memberId 
        ? { ...member, role: data.role } 
        : member
    ))
    debouncedToast(`Team member role updated`);
  }, [setMembers, debouncedToast]);

  useEffect(() => {
    // Subscribe to channels
    const projectsChannel = pusherClient.subscribe(CHANNELS.PROJECTS)
    const tasksChannel = pusherClient.subscribe(CHANNELS.TASKS)
    const membersChannel = pusherClient.subscribe(CHANNELS.MEMBERS)

    // Project events
    projectsChannel.bind(EVENTS.PROJECT_UPDATED, handleProjectUpdate)
    projectsChannel.bind(EVENTS.PROJECT_CREATED, handleProjectCreate)
    projectsChannel.bind(EVENTS.PROJECT_DELETED, handleProjectDelete)
    projectsChannel.bind(EVENTS.PROJECT_PROGRESS_UPDATED, handleProjectProgressUpdate)

    // Task events
    tasksChannel.bind(EVENTS.TASK_CREATED, handleTaskCreate)
    tasksChannel.bind(EVENTS.TASK_UPDATED, handleTaskUpdate)
    tasksChannel.bind(EVENTS.TASK_DELETED, handleTaskDelete)
    tasksChannel.bind(EVENTS.TASK_ASSIGNED, handleTaskAssign)
    tasksChannel.bind(EVENTS.TASK_COMPLETED, handleTaskComplete)

    // Member events
    membersChannel.bind(EVENTS.MEMBER_ADDED, handleMemberAdd)
    membersChannel.bind(EVENTS.MEMBER_REMOVED, handleMemberRemove)
    membersChannel.bind(EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdate)

    // Error handling
    pusherClient.connection.bind('error', (err: any) => {
      console.error('Pusher Error:', err)
      debouncedToast('Connection error. Retrying...', 'error')
    })

    // Cleanup
    return () => {
      projectsChannel.unbind_all()
      tasksChannel.unbind_all()
      membersChannel.unbind_all()
      
      pusherClient.unsubscribe(CHANNELS.PROJECTS)
      pusherClient.unsubscribe(CHANNELS.TASKS)
      pusherClient.unsubscribe(CHANNELS.MEMBERS)
    }
  }, [
    handleProjectUpdate,
    handleProjectCreate,
    handleProjectDelete,
    handleProjectProgressUpdate,
    handleTaskCreate,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskAssign,
    handleTaskComplete,
    handleMemberAdd,
    handleMemberRemove,
    handleMemberRoleUpdate,
    debouncedToast
  ])
} 