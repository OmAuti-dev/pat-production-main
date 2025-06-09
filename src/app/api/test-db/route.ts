import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection by trying to count users
    const userCount = await db.user.count()
    
    // Try to create a test user
    const testUser = await db.user.create({
      data: {
        clerkId: 'test-' + Date.now(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT'
      }
    })

    return NextResponse.json({
      message: 'Database connection successful',
      userCount,
      testUser
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 