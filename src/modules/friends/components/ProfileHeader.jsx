import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Edit2, MapPin, Mail, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectUser, updateUserData } from '@/app/store/authSlice';
import api from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import FriendButton from './FriendButton';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * ProfileHeader
 *
 * isOwnProfile === true  → edit/upload controls
 * isOwnProfile === false → FriendButton (driven by useFriendship hook)
 */
export default function ProfileHeader({ isOwnProfile }) {
  const { userId }    = useParams();
  const dispatch      = useAppDispatch();
  const currentUser   = useAppSelector(selectUser);

  const avatarRef = useRef(null);
  const coverRef  = useRef(null);
  const [uploading, setUploading] = useState({ avatar: false, cover: false });

  const handleUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('ফাইল ৫MB-এর বেশি হতে পারবে না');
      e.target.value = ''; // reset so same file can be retried after compression
      return;
    }

    const fieldName = type === 'avatar' ? 'image' : 'coverPhoto';
    const endpoint  = type === 'avatar' ? '/users/upload-picture' : '/users/upload-picture/cover';
    const label     = type === 'avatar' ? 'প্রোফাইল' : 'কভার';

    const form = new FormData();
    form.append(fieldName, file);

    setUploading((p) => ({ ...p, [type]: true }));
    const tid = toast.loading(`${label} ফটো আপলোড হচ্ছে...`);

    try {
      const { data } = await api.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!data.success) throw new Error('আপলোড সফল হয়নি');

      dispatch(updateUserData(data.data));
      toast.success(`${label} ফটো আপডেট হয়েছে!`, { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'সার্ভারে সমস্যা হয়েছে', { id: tid });
    } finally {
      setUploading((p) => ({ ...p, [type]: false }));
      e.target.value = ''; // allow re-selecting same file
    }
  };

  return (
    <div className="bg-card shadow-card rounded-b-card overflow-hidden">
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div className="h-48 md:h-72 bg-gray-100 relative group">
        {currentUser?.coverPhoto ? (
          <img
            src={currentUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary-dark/5" />
        )}

        {isOwnProfile && (
          <>
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                disabled={uploading.cover}
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-btn flex items-center gap-2 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
              >
                {uploading.cover
                  ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <ImageIcon size={16} />}
                কভার পরিবর্তন করুন
              </button>
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e, 'cover')}
            />
          </>
        )}
      </div>

      {/* ── Profile info ──────────────────────────────────────────────────── */}
      <div className="px-md md:px-xl pb-md">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-md md:gap-lg">

          {/* Avatar */}
          <div className="relative -mt-16 md:-mt-20">
            <div className="relative group">
              <Avatar
                src={currentUser?.profilePicture}
                name={currentUser?.name}
                className="w-32 h-32 md:w-44 md:h-44 ring-4 ring-card shadow-card-hover rounded-full object-cover"
              />
              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploading.avatar}
                    className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full border-4 border-card hover:scale-110 transition-transform shadow-card disabled:opacity-60"
                  >
                    {uploading.avatar
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={17} />}
                  </button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, 'avatar')}
                  />
                </>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left md:pb-4">
            <h1 className="text-h1 font-heading font-bold text-text-main leading-tight">
              {currentUser?.name}
            </h1>
            <p className="text-body text-text-secondary mt-1">
              {currentUser?.bio || 'বুক লাভার ও সমাজকর্মী'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-md mt-sm text-small text-text-light">
              <span className="flex items-center gap-1"><MapPin size={13} /> বাংলাদেশ</span>
              <span className="flex items-center gap-1"><Mail size={13} /> {currentUser?.email}</span>
            </div>
          </div>

          {/* Action */}
          <div className="md:pb-6">
            {isOwnProfile ? (
              <Button variant="outline" className="gap-2 bg-card/50 backdrop-blur-sm">
                <Edit2 size={16} /> প্রোফাইল এডিট
              </Button>
            ) : (
              <FriendButton userId={userId} showRemove size="md" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}