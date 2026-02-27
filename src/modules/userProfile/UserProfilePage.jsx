import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';

import { useAppSelector } from '@/hooks/useRedux';
import { selectUser } from '@/app/store/authSlice';
import {
  fetchUserProfile,
  resetProfile,
  selectProfileUser,
  selectProfileLoading,
} from './userProfileSlice';

import UserProfileHeader from './components/UserProfileHeader';
import UserPostsTab      from './components/UserPostsTab';
import UserFriendsTab    from './components/UserFriendsTab';

const TABS = [
  { key: 'posts',   label: 'পোস্ট' },
  { key: 'friends', label: 'বন্ধুরা' },
];

const UserProfilePage = () => {
  const { userId }    = useParams();
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const currentUser   = useAppSelector(selectUser);
  const profileUser   = useSelector(selectProfileUser);
  const { profile: isLoading } = useSelector(selectProfileLoading);

  const [activeTab, setActiveTab] = useState('posts');

   // ← এই তিনটা line যুক্ত করুন
 console.log('are they equal?', userId === currentUser?._id?.toString());
console.log('userId type:', typeof userId);
console.log('currentUser._id:', currentUser?._id, typeof currentUser?._id);
  // নিজের প্রোফাইলে এলে /app/profile-এ redirect
useEffect(() => {
  if (!userId) return;

  const isSelf = currentUser?._id &&
    userId.toString() === currentUser._id.toString();

  if (isSelf) {
    navigate('/app/profile', { replace: true });
    return;
  }

  dispatch(resetProfile());
  dispatch(fetchUserProfile(userId));

}, [userId, dispatch]); // ← currentUser._id এবং navigate সরিয়ে দিন

  // Error state — user not found
  if (!isLoading && !profileUser) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary font-medium">ইউজার পাওয়া যায়নি</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ChevronLeft size={16} /> ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-gray-100 px-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          ফিরে যান
        </button>
      </div>

      {/* Header: cover + avatar + info + buttons */}
      <UserProfileHeader
        user={profileUser}
        friendCount={profileUser?.friendCount ?? 0}
      />

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        {/* Tab bar */}
        <div className="flex bg-card rounded-card shadow-card mb-4 overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pb-8">
          {activeTab === 'posts'   && <UserPostsTab   userId={userId} />}
          {activeTab === 'friends' && <UserFriendsTab userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;