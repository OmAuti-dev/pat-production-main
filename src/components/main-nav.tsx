import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/communications"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Communications</span>
        </div>
      </Link>
    </nav>
  )
} 