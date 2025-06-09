import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
      <h1 className="text-4xl font-bold text-white">404 - Page Not Found</h1>
      <p className="mt-4 text-lg text-gray-400">The page you're looking for doesn't exist.</p>
      <Link 
        href="/"
        className="mt-8 rounded-lg bg-white px-6 py-3 text-lg font-semibold text-black transition-colors hover:bg-gray-200"
      >
        Go Home
      </Link>
    </div>
  )
} 