import { Loader2 } from 'lucide-react'

/**
 * Inline Loader — spinner
 */
export function Loader({ size = 'md', className = '' }) {
  const sizeMap = { sm: 16, md: 28, lg: 44 }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2
        size={sizeMap[size] ?? 28}
        className="animate-spin text-primary"
      />
    </div>
  )
}

/**
 * Full Page Loader — center of screen
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-small text-text-secondary">লোড হচ্ছে...</p>
      </div>
    </div>
  )
}

/**
 * Skeleton shimmer block
 */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

/**
 * Card Skeleton — for list loading
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton className="h-40 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
