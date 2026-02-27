import { Loader2 } from 'lucide-react'

/**
 * Button Component
 * variant: 'primary' | 'donate' | 'secondary' | 'ghost' | 'danger'
 * size: 'sm' | 'md' | 'lg' | 'full'
 */
export function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  className = '',
  type     = 'button',
  ...props
}) {
  const variantClass = {
    primary:   'btn btn-primary',
    donate:    'btn btn-donate',
    secondary: 'btn btn-secondary',
    ghost:     'btn btn-ghost',
    danger:    'btn btn-danger',
  }[variant] ?? 'btn btn-primary'

  const sizeClass = {
    sm:   'text-[14px] px-3 py-2',
    md:   '',            // default from css
    lg:   'px-6 py-4 text-[16px]',
    full: 'w-full',
  }[size] ?? ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 size={16} className="animate-spin" />
      )}
      {children}
    </button>
  )
}
