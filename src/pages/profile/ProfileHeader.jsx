import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import imageCompression from 'browser-image-compression';
import {
  Camera,
  Edit2,
  Mail,
  MapPin,
  ImageIcon,
  UserPlus,
  UserCheck,
  Clock,
  UserMinus,
  MessageCircle,
  Loader2,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectUser, updateUserData } from "@/app/store/authSlice";
import api from "@/services/api";
import { Avatar } from "@/components/ui/Avatar";

// ✅ নতুন friendSlice থেকে import
import useFriendship from "@/modules/friends/hooks/useFriendship";
import useMessageUser from "@/modules/userProfile/hooks/useMessageUser";
import EditProfileModal from "./EditProfileModal";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileHeader({ isOwnProfile }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);

  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  const [uploading, setUploading] = useState({ avatar: false, cover: false });
  const [editOpen, setEditOpen] = useState(false);

  // ✅ friendship hook — শুধু অন্যের প্রোফাইলে কাজ করবে
  const { status, isStatusLoading, isActionLoading, send, remove } =
    useFriendship(!isOwnProfile ? userId : null);

  // ✅ message hook
  const { openChat, loading: chatLoading } = useMessageUser();

  /* ── Upload handler ────────────────────────────────────────── */
const handleUpload = async (e, type) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Optional: check file type
  if (!file.type.startsWith("image/")) {
    toast.error("শুধু ছবি আপলোড করতে হবে");
    e.target.value = "";
    return;
  }

  if (file.size > MAX_SIZE) {
    toast.error("ফাইল ৫MB-এর বেশি হতে পারবে না");
    e.target.value = "";
    return;
  }

  // --- Frontend Compression + WebP ---
  const options = {
    maxSizeMB: 0.5,            // final size ~500KB
    maxWidthOrHeight: 1024,    // resize resolution
    useWebWorker: true,
    fileType: "image/webp",    // convert to WebP
  };
  const compressedFile = await imageCompression(file, options);

  const fieldName = type === "avatar" ? "image" : "coverPhoto";
  const endpoint =
    type === "avatar"
      ? "/users/upload-picture"
      : "/users/upload-picture/cover";
  const label = type === "avatar" ? "প্রোফাইল" : "কভার";

  const form = new FormData();
  form.append(fieldName, compressedFile);

  setUploading((p) => ({ ...p, [type]: true }));
  const tid = toast.loading(`${label} ফটো আপলোড হচ্ছে...`);

  try {
    const { data } = await api.post(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!data.success) throw new Error();
    dispatch(updateUserData(data.data));
    toast.success(`${label} ফটো আপডেট হয়েছে!`, { id: tid });
  } catch (err) {
    toast.error(err?.response?.data?.message ?? "সার্ভারে সমস্যা হয়েছে", {
      id: tid,
    });
  } finally {
    setUploading((p) => ({ ...p, [type]: false }));
    e.target.value = "";
  }
};

  /* ── Action Buttons ────────────────────────────────────────── */
  const renderActions = () => {
    // নিজের প্রোফাইল
    if (isOwnProfile) {
      return (
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn
    bg-white border border-gray-200 shadow-sm
    text-sm font-semibold text-text-main
    hover:bg-primary hover:text-white hover:border-primary
    transition-all duration-200 group"
        >
          <Edit2
            size={15}
            className="text-text-secondary group-hover:text-white transition-colors"
          />
          প্রোফাইল এডিট
        </button>
      );
    }

    // অন্যের প্রোফাইল — status loading
    if (isStatusLoading) {
      return (
        <button
          disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed"
        >
          <Loader2 size={14} className="animate-spin" />
          লোড হচ্ছে...
        </button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {/* Friend button */}
        {status === "accepted" && (
          <button
            onClick={remove}
            disabled={isActionLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn
              bg-secondary/10 text-secondary border border-secondary/20
              hover:bg-red-50 hover:text-red-500 hover:border-red-200
              text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {isActionLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserMinus size={14} />
            )}
            বন্ধু আছেন
          </button>
        )}

        {status === "pending" && (
          <button
            disabled
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn
              bg-amber-50 text-amber-600 border border-amber-200
              text-sm font-semibold cursor-default"
          >
            <Clock size={14} />
            রিকোয়েস্ট পাঠানো হয়েছে
          </button>
        )}

        {(status === "none" || !status) && (
          <button
            onClick={send}
            disabled={isActionLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn
              bg-primary text-white shadow-sm
              hover:bg-primary-dark
              text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {isActionLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            বন্ধু করুন
          </button>
        )}

        {/* Message button — শুধু বন্ধু হলে */}
        {status === "accepted" && (
          <button
            onClick={() => openChat(userId)}
            disabled={chatLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn
              bg-white border border-gray-200 shadow-sm text-text-main
              hover:bg-gray-50 text-sm font-semibold
              transition-all duration-200 disabled:opacity-50"
          >
            {chatLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MessageCircle size={14} />
            )}
            মেসেজ
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card shadow-card rounded-b-card overflow-hidden">
      {/* ── Cover ──────────────────────────────────────────────── */}
      <div className="h-48 md:h-64 bg-gray-100 w-full relative group">
        {currentUser?.coverPhoto ? (
          <img
            src={currentUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover aspect-video rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/25 via-secondary/10 to-primary/5" />
        )}

        {isOwnProfile && (
          <>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploading.cover}
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-btn
                  flex items-center gap-2 text-sm font-semibold
                  hover:bg-white transition-colors disabled:opacity-50 shadow-sm"
              >
                {uploading.cover ? (
                  <Loader2 size={15} className="animate-spin text-gray-400" />
                ) : (
                  <ImageIcon size={15} />
                )}
                কভার পরিবর্তন
              </button>
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e, "cover")}
            />
          </>
        )}
      </div>

      {/* ── Profile Info ────────────────────────────────────────── */}
      <div className="px-md md:px-xl pb-md">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-md md:gap-lg">
          {/* Avatar */}
          <div className="relative -mt-16 md:-mt-20 shrink-0">
            <div className="relative group/avatar">
              <Avatar
                src={currentUser?.profilePicture}
                name={currentUser?.name}
                className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-card shadow-card-hover rounded-full object-cover"
              />
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploading.avatar}
                    className="absolute bottom-2 right-2 p-2.5
                      bg-primary text-white rounded-full
                      border-4 border-card shadow-card
                      hover:scale-110 hover:bg-primary-dark
                      transition-all duration-200 disabled:opacity-60"
                  >
                    {uploading.avatar ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                  </button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, "avatar")}
                  />
                </>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left md:pb-3 min-w-0">
            <h1 className="text-h1 font-heading font-bold text-text-main leading-tight truncate">
              {currentUser?.name}
            </h1>
            <p className="text-body text-text-secondary mt-1 line-clamp-2">
              {currentUser?.bio || "বুক লাভার ও সমাজকর্মী"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-md mt-sm text-small text-text-light">
              <span className="flex items-center gap-1">
                <MapPin size={13} /> বাংলাদেশ
              </span>
              <span className="flex items-center gap-1">
                <Mail size={13} /> {currentUser?.email}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="md:pb-4 shrink-0">{renderActions()}</div>
        </div>
      </div>
       <EditProfileModal
      isOpen={editOpen}
      onClose={() => setEditOpen(false)}
    />
    </div>
  );
}
