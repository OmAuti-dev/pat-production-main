import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingProps {
  value?: number
  onChange?: (value: number) => void
  readOnly?: boolean
}

export function Rating({ value = 0, onChange, readOnly = false }: RatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            'text-yellow-500 transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-600',
            star <= value ? 'opacity-100' : 'opacity-30'
          )}
        >
          <Star className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
} 