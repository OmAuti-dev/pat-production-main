'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EditUserProfileSchema } from '@/lib/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Loader2, Plus, X, Check, ChevronsUpDown } from 'lucide-react'
import { Badge } from '../ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { cn } from '@/lib/utils'
import { skillCategories, allSkills } from '@/config/skills'

type Props = {
  user: {
    name: string
    email: string
    role: string
    phoneNumber?: string | null
    skills?: string[]
    experience?: number
    resumeUrl?: string | null
    tier?: string | null
    credits?: string | null
  }
  onUpdate: (values: any) => Promise<void>
}

const ProfileForm = ({ user, onUpdate }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [skillSearch, setSkillSearch] = useState('')
  const [openSkills, setOpenSkills] = useState(false)
  
  const form = useForm<z.infer<typeof EditUserProfileSchema>>({
    mode: 'onChange',
    resolver: zodResolver(EditUserProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      skills: user.skills || [],
      experience: user.experience || 0,
      resumeUrl: user.resumeUrl || '',
      tier: user.tier || 'Free',
      credits: user.credits || '10'
    },
  })

  const handleSubmit = async (
    values: z.infer<typeof EditUserProfileSchema>
  ) => {
    setIsLoading(true)
    await onUpdate(values)
    setIsLoading(false)
  }

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills') || []
    if (!currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill])
    }
    setOpenSkills(false)
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills') || []
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove))
  }

  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      skills: user.skills || [],
      experience: user.experience || 0,
      resumeUrl: user.resumeUrl || '',
      tier: user.tier || 'Free',
      credits: user.credits || '10'
    })
  }, [user])

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          disabled={isLoading}
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">User full name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={true}
                  placeholder="Email"
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          disabled={isLoading}
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Phone Number</FormLabel>
              <FormDescription>
                Optional: Add your contact number
              </FormDescription>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="Phone Number"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {user.role !== 'CLIENT' && (
          <>
            <FormField
              disabled={isLoading}
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Skills</FormLabel>
                  <FormDescription>
                    Add your professional skills
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value?.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Popover open={openSkills} onOpenChange={setOpenSkills}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSkills}
                          className="w-full justify-between"
                        >
                          Select skills...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search skills..."
                            value={skillSearch}
                            onValueChange={setSkillSearch}
                          />
                          <CommandEmpty>No skill found.</CommandEmpty>
                          {Object.entries(skillCategories).map(([category, skills]) => (
                            <CommandGroup key={category} heading={category}>
                              {skills
                                .filter(skill => 
                                  skill.toLowerCase().includes(skillSearch.toLowerCase())
                                )
                                .map(skill => (
                                  <CommandItem
                                    key={skill}
                                    value={skill}
                                    onSelect={() => addSkill(skill)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(skill)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {skill}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          ))}
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isLoading}
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Years of Experience</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="Years of experience"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isLoading}
              control={form.control}
              name="resumeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Resume/CV</FormLabel>
                  <FormDescription>
                    Upload your resume or CV to verify your skills
                  </FormDescription>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Here we'll use the same upload mechanism as profile picture
                          const formData = new FormData()
                          formData.append('file', file)
                          // You'll need to implement the upload endpoint
                          try {
                            const response = await fetch('/api/upload-resume', {
                              method: 'POST',
                              body: formData,
                            })
                            const data = await response.json()
                            if (data.url) {
                              field.onChange(data.url)
                            }
                          } catch (error) {
                            console.error('Error uploading resume:', error)
                          }
                        }
                      }}
                    />
                    {field.value && (
                      <a
                        href={field.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Current Resume
                      </a>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button
          type="submit"
          className="self-start hover:bg-[#2F006B] hover:text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            'Save User Settings'
          )}
        </Button>
      </form>
    </Form>
  )
}

export default ProfileForm
