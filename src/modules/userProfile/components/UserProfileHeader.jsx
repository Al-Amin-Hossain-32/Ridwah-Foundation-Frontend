import { MapPin, Mail, Users, MessageCircle, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectProfileLoading } from '../userProfileSlice';
import FriendButton from '@/modules/friends/components/FriendButton';
import useMessageUser from '../hooks/useMessageUser';
import useFriendship from '@/modules/friends/hooks/useFriendship';

/**
 * UserProfileHeader
 * অন্যের প্রোফাইলের cover + avatar + info + action buttons
 */
const UserProfileHeader = ({ user, friendCount }) => {
  const { profile: isLoading }   = useSelector(selectProfileLoading);
  const { status }               = useFriendship(user?._id);
  const { openChat, loading: chatLoading } = useMessageUser();

  if (isLoading || !user) {
    return (
      <div className="bg-card shadow-card rounded-b-card overflow-hidden animate-pulse">
        <div className="h-48 md:h-64 bg-gray-200" />
        <div className="px-md md:px-xl pb-md">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-md">
            <div className="-mt-16 w-32 h-32 rounded-full bg-gray-300 ring-4 ring-card" />
            <div className="flex-1 space-y-2 py-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-card rounded-b-card overflow-hidden">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gray-100">
        {user.coverPhoto ? (
          <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary-dark/5" />
        )}
      </div>

      {/* Info */}
      <div className="px-md md:px-xl pb-md">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-md md:gap-lg">

          {/* Avatar */}
          <div className="-mt-16 md:-mt-20 shrink-0">
            <img
              src={user.profilePicture || '/avatar.png'}
              alt={user.name}
              onError={(e) => { e.currentTarget.src = '/avatar.png'; }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-card shadow-card-hover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left md:pb-3">
            <h1 className="text-h1 font-heading font-bold text-text-main leading-tight">
              {user.name}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">@{user.username}</p>
            {user.bio && (
              <p className="text-body text-text-secondary mt-1">{user.bio}</p>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-x-md mt-sm text-small text-text-light">
              <span className="flex items-center gap-1">
                <Users size={13} />
                {friendCount} বন্ধু
              </span>
              <span className="flex items-center gap-1">
                <Mail size={13} /> {user.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} /> বাংলাদেশ
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="md:pb-4 flex flex-wrap justify-center gap-2">
            <FriendButton userId={user._id} showRemove />

            {/* Message বাটন — শুধু বন্ধু হলে দেখাবে */}
            {status === 'accepted' && (
              <button
                onClick={() => openChat(user._id)}
                disabled={chatLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <MessageCircle size={15} />}
                মেসেজ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;