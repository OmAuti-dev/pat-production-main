'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  projects: string[]
}

interface Project {
  id: string
  name: string
}

export function RoleManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
    fetchProjects()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      toast.error('Failed to fetch projects')
    }
  }

  const handleRoleChange = async (employeeId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) throw new Error('Failed to update role')
      
      setEmployees(employees.map(emp => 
        emp.id === employeeId ? { ...emp, role: newRole } : emp
      ))
      
      toast.success('Role updated successfully')
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleProjectAssignment = async (employeeId: string, projectId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) throw new Error('Failed to assign project')

      const updatedEmployee = await response.json()
      setEmployees(employees.map(emp => 
        emp.id === employeeId ? updatedEmployee : emp
      ))
      
      toast.success('Project assigned successfully')
    } catch (error) {
      toast.error('Failed to assign project')
    }
  }

  const handleRemoveFromProject = async (employeeId: string, projectId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove from project')

      setEmployees(employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, projects: emp.projects.filter(p => p !== projectId) }
          : emp
      ))
      
      toast.success('Removed from project successfully')
    } catch (error) {
      toast.error('Failed to remove from project')
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No employees found</TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <Select
                      value={employee.role}
                      onValueChange={(value) => handleRoleChange(employee.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {employee.projects.map((projectId) => {
                        const project = projects.find(p => p.id === projectId)
                        return project ? (
                          <div key={project.id} className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1">
                            <span className="text-sm">{project.name}</span>
                            <button
                              onClick={() => handleRemoveFromProject(employee.id, project.id)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null
                      })}
                      <Select
                        onValueChange={(value) => handleProjectAssignment(employee.id, value)}
                      >
                        <SelectTrigger className="w-10 h-7 p-0 border-dashed">
                          <Plus className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects
                            .filter(project => !employee.projects.includes(project.id))
                            .map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Add any additional actions here */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 