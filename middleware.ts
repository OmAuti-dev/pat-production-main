import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  
  // Debug logs for development
  debug: process.env.NODE_ENV === 'development',

  // Custom JWT template to include necessary claims
  jwtOptions: {
    // Set longer expiration for the session token
    expireIn: "7d",
    // Include custom claims if needed
    claims: (token) => ({
      ...token,
      // Add any custom claims you need
    })
  },

  // Handle what happens before a request
  beforeAuth: (req) => {
    // Add any custom logic before authentication
  },

  // Handle what happens after authentication
  afterAuth: (auth, req) => {
    // Add any custom logic after authentication
  }
})

// Configure Middleware Matcher
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
} 