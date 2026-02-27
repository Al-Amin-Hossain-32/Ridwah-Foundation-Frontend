import { getInitials } from '@/utils/formatters'

/**
 * Avatar Component
 * size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeClass = {
    xs:  'w-7 h-7 text-[11px]',
    sm:  'w-9 h-9 text-[13px]',
    md:  'w-11 h-11 text-[15px]',
    lg:  'w-16 h-16 text-[20px]',
    xl:  'w-24 h-24 text-[28px]',
  }[size] ?? 'w-11 h-11 text-[15px]'

  return (
    <div
      className={`
        ${sizeClass}
        rounded-full overflow-hidden flex-shrink-0
        flex items-center justify-center
        ${className}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <div className="w-full h-full bg-primary/10 flex items-center justify-center font-heading font-semibold text-primary">
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}
