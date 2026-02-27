/**
 * EmptyState — যখন কোনো data নেই
 */
export function EmptyState({
  icon        = '📭',
  title       = 'কোনো তথ্য নেই',
  description,
  action,
  className   = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-heading font-semibold text-text-main mb-2">{title}</h3>
      {description && (
        <p className="text-small text-text-secondary mb-6 max-w-xs">{description}</p>
      )}
      {action && action}
    </div>
  )
}
