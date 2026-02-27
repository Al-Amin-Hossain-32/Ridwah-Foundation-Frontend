import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Modal Component
 * size: 'sm' | 'md' | 'lg' | 'xl'
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',
  closeable = true,
}) {
  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const maxWidthClass = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-xl',
    full: 'max-w-full mx-4',
  }[size] ?? 'max-w-md'

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeable) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`
          relative bg-white w-full ${maxWidthClass}
          rounded-t-[24px] sm:rounded-[14px]
          shadow-xl max-h-[90vh] flex flex-col
          animate-[slideUp_0.25s_ease]
        `}
      >
        {/* Header */}
        {(title || closeable) && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
            {title && (
              <h3 className="font-heading font-semibold text-text-main">{title}</h3>
            )}
            {closeable && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
              >
                <X size={18} className="text-text-secondary" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

/* Add this to tailwind.config animations if needed */
// '@keyframes slideUp': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } }
