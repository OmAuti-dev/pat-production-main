export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Checking permissions...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we verify your access.</p>
      </div>
    </div>
  )
} 