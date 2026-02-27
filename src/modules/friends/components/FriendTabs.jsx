import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectRequests } from '../friendSlice';

const FriendTabs = () => {
  const requests     = useSelector(selectRequests);
  const pendingCount = requests.length;

  const cls = ({ isActive }) =>
    `flex-1 relative text-center py-2.5 text-sm font-medium transition-colors select-none ${
      isActive
        ? 'border-b-2 border-primary text-primary'
        : 'text-text-secondary hover:text-text-main'
    }`;

  return (
    <div className="flex bg-card rounded-card shadow-card mb-4 overflow-hidden">
      <NavLink to="/app/friends" end className={cls}>
        বন্ধুরা
      </NavLink>

      <NavLink to="/app/friends/requests" className={cls}>
        রিকোয়েস্ট
        {pendingCount > 0 && (
          <span className="absolute top-1.5 right-[18%] bg-error text-white text-[10px] font-bold leading-none rounded-full w-4 h-4 flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </NavLink>

      <NavLink to="/app/friends/suggestions" className={cls}>
        সাজেশন
      </NavLink>
    </div>
  );
};

export default FriendTabs;