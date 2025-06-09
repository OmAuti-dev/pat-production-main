import { HeroSection } from '@/components/global/hero-section'
import Navbar from '@/components/global/navbar'
import Footer from '@/components/global/footer'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

export default async function RootPage() {
  const user = await currentUser()
  
  let userRole = null
  if (user) {
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })
    userRole = dbUser?.role
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <div className="flex-1">
        <HeroSection isAuthenticated={!!user} userRole={userRole} />
      </div>
      <Footer />
    </main>
  )
}
