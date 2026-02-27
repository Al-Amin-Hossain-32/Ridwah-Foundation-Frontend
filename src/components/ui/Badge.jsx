/**
 * Badge Component
 * variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'donate'
 */
export function Badge({ children, variant = 'default', className = '' }) {
  const variantClass = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger:  'bg-red-100 text-red-600',
    donate:  'bg-donate/10 text-donate',
    pending: 'bg-orange-100 text-orange-600',
  }[variant] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-0.5 rounded-full
        text-[12px] font-medium
        ${variantClass} ${className}
      `}
    >
      {children}
    </span>
  )
}

/**
 * Status Badge — donation/request status এর জন্য
 */
export function StatusBadge({ status }) {
  const config = {
    pending:   { label: 'Pending',   variant: 'pending' },
    approved:  { label: 'Approved',  variant: 'success' },
    rejected:  { label: 'Rejected',  variant: 'danger'  },
    issued:    { label: 'Issued',    variant: 'primary' },
    returned:  { label: 'Returned',  variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'default' },
    active:    { label: 'Active',    variant: 'success' },
    paused:    { label: 'Paused',    variant: 'warning' },
    cancelled_r:{ label: 'Cancelled', variant: 'danger' },
  }

  const { label, variant } = config[status] ?? { label: status, variant: 'default' }

  return <Badge variant={variant}>{label}</Badge>
}
