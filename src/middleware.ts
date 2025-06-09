import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware function to add pathname to headers
function addPathToHeaders(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Clerk auth middleware with pathname handling
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/api/user/role",
    "/api/user/sync",
    "/_next/static/(.*)",
    "/favicon.ico",
    "/assets/(.*)"
  ],
  // Ensure Clerk handles the sign-in and callback URLs correctly
  ignoredRoutes: ["/api/webhook"],
  // Add pathname to headers before auth check
  beforeAuth: (req) => {
    return addPathToHeaders(req)
  }
})

// Simplified matcher pattern
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}

// https://www.googleapis.com/auth/userinfo.email
// https://www.googleapis.com/auth/userinfo.profile
// https://www.googleapis.com/auth/drive.activity.readonly
// https://www.googleapis.com/auth/drive.metadata
// https://www.googleapis.com/auth/drive.readonly
