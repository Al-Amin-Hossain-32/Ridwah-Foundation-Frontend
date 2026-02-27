/**
 * Card Component — consistent across Campaign / Book / Post / Donation
 * Design: white bg, 14px radius, 16px padding, soft shadow
 */
export function Card({
  children,
  hover     = true,
  padding   = true,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        card
        ${hover   ? 'card-hover' : ''}
        ${!padding ? '!p-0 overflow-hidden' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
