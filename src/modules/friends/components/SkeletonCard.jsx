/**
 * SkeletonCard — list loading placeholder
 * @param {number} count
 */
const SkeletonCard = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-card p-4 flex items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="w-20 h-8 bg-gray-100 rounded-btn" />
      </div>
    ))}
  </>
);

export default SkeletonCard;