/**
 * EmptyState — reusable empty list placeholder
 */
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center select-none">
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon size={26} className="text-primary/50" />
      </div>
    )}
    <p className="font-medium text-text-secondary">{title}</p>
    {subtitle && <p className="text-sm text-text-light mt-1">{subtitle}</p>}
  </div>
);

export default EmptyState;