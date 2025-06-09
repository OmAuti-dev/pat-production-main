'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { skillCategories, allSkills, type Skill } from '@/config/skills'
import { toast } from 'sonner'

interface UserProfile {
  name: string | null
  email: string
  phoneNumber: string | null
  skills: Skill[]
  experience: number
  resumeUrl: string | null
}

export default function SettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phoneNumber: '',
    skills: [],
    experience: 0,
    resumeUrl: null
  })
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      toast.success('Profile updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredSkills = searchValue === '' 
    ? allSkills 
    : allSkills.filter((skill) =>
        skill.toLowerCase().includes(searchValue.toLowerCase())
      )

  const toggleSkill = (skill: Skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const removeSkill = (skillToRemove: Skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile.name || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              placeholder="Your email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phoneNumber || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              value={profile.experience}
              onChange={(e) => setProfile(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
              placeholder="Years of experience"
            />
          </div>

          <div className="grid gap-2">
            <Label>Skills</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="justify-between"
                >
                  Select skills...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search skills..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandEmpty>No skills found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {Object.entries(skillCategories).map(([category, skills]) => (
                      <div key={category}>
                        <h3 className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {category}
                        </h3>
                        {skills.filter(skill => 
                          skill.toLowerCase().includes(searchValue.toLowerCase())
                        ).map((skill) => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => toggleSkill(skill)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                profile.skills.includes(skill) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {skill}
                          </CommandItem>
                        ))}
                      </div>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-2 mt-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="resume">Resume URL</Label>
            <Input
              id="resume"
              value={profile.resumeUrl || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, resumeUrl: e.target.value }))}
              placeholder="Link to your resume"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
