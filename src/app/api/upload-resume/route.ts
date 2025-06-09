import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and DOC/DOCX files are allowed.' }, { status: 400 })
    }

    // Here you would typically:
    // 1. Upload the file to a storage service (e.g., AWS S3, Google Cloud Storage)
    // 2. Get the URL of the uploaded file
    // For this example, we'll simulate it with a placeholder URL
    const uploadedUrl = `https://storage.example.com/resumes/${user.id}/${file.name}`

    // Update the user's resumeUrl in the database
    await db.user.update({
      where: { clerkId: user.id },
      data: { resumeUrl: uploadedUrl }
    })

    return NextResponse.json({ url: uploadedUrl })
  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
  }
} 