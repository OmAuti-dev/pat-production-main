'use client'

import React, { use, useEffect, useState } from 'react'
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
import { Loader2, Plus, X } from 'lucide-react'
import { Badge } from '../ui/badge'

type Props = {
  user: any
  onUpdate?: any
}

const ProfileForm = ({ user, onUpdate }: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  
  const form = useForm<z.infer<typeof EditUserProfileSchema>>({
    mode: 'onChange',
    resolver: zodResolver(EditUserProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      skills: user.skills || [],
      phoneNumber: user.phoneNumber || '',
      resumeUrl: user.resumeUrl || '',
    },
  })

  const handleSubmit = async (
    values: z.infer<typeof EditUserProfileSchema>
  ) => {
    setIsLoading(true)
    await onUpdate(values)
    setIsLoading(false)
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = form.getValues('skills') || []
      if (!currentSkills.includes(newSkill.trim())) {
        form.setValue('skills', [...currentSkills, newSkill.trim()])
      }
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills') || []
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove))
  }

  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      skills: user.skills || [],
      phoneNumber: user.phoneNumber || '',
      resumeUrl: user.resumeUrl || '',
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
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Skills</FormLabel>
              <FormDescription>
                Add your professional skills (required)
              </FormDescription>
              <div className="flex flex-wrap gap-2 mb-2">
                {field.value?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
