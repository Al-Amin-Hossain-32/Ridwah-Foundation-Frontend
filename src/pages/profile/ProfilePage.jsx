import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Edit2,
  Settings,
  BookOpen,
  Heart,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { selectUser, updateUserData } from "@/app/store/authSlice";
import { fetchMyDonations, selectMyDonations } from "@/app/store/donationSlice";
import { fetchMyRequests, selectMyRequests } from "@/app/store/bookSlice";
import userService from "@/services/user.service";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import CreatePost from "../social/CreatePost";
import { BottomNav } from "../../layouts/BottomNav";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const donations = useAppSelector(selectMyDonations);
  const requests = useAppSelector(selectMyRequests);
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
console.log(user?.coverPhoto)
console.log(user)
  useEffect(() => {
    dispatch(fetchMyDonations());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("profilePicture", file);
      const res = await userService.uploadPicture(fd);
      dispatch(
        updateUserData({ profilePicture: res.data.profilePicture || res.data.url }),
      );
      toast.success("Profile picture update হয়েছে!");
    } catch {
      toast.error("Upload করা যায়নি");
    } finally {
      setUploading(false);
    }
  };

  const coverPhotoPlaceHolder = "https://static.vecteezy.com/system/resources/thumbnails/048/910/778/small/default-image-missing-placeholder-free-vector.jpg"

  return (
    <div className="page-wrapper">
      {/* ── Profile Header ───────────────────── */}
     <div className="relative w-full">
  {/* Cover Photo */}
  <img
    src={user?.coverPhoto || coverPhotoPlaceHolder} // Default fallback
    
    alt={user?.name}
    className="h-24 w-full object-cover rounded-t-lg"
  />

  {/* Profile Content Container */}
  <div className="flex flex-col items-center pb-md mb-lg">
    
    {/* Avatar with upload - Negative margin added here (-mt-12) */}
    <div className="relative -mt-12 mb-md"> 
      <Avatar
        src={user?.profilePicture}
        name={user?.name}
        size="xl"
        className="ring-4 ring-white shadow-lg" // সাদা রিং দিলে কভার ফটোর ওপর ফুটে উঠবে
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
        disabled={uploading}
      >
        <Camera size={14} className="text-white" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </div>

    {/* Info Section */}
    <div className="text-center px-4">
      <h2 className="font-heading text-xl font-bold text-text-main">{user?.name}</h2>
      <p className="text-small text-text-secondary mt-1">{user?.email}</p>
      {user?.phone && (
        <p className="text-small text-text-secondary">{user.phone}</p>
      )}
      <p className="text-small text-text-secondary mt-2 max-w-xs italic">{user?.bio}</p>
      <Badge variant="primary" className="mt-3 capitalize">
        {user?.role}
      </Badge>
    </div>
  </div>

  {/* Edit Button - Positioning updated */}
  <div className="absolute top-4 right-4">
    <Link to="/app/profile/edit">
      <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all">
        <Edit2 size={18} className="text-primary" />
      </div>
    </Link>
  </div>
</div>
      <CreatePost />

      <div className="flex row items-center gap-md font-bold text-primary text-[20px]">
        <div>My Post</div>
        <div>About</div>
        <div>Friends</div>
      </div>
      {/* ── Stats ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-sm mb-lg">
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-primary text-[20px]">
            {formatCurrency(user?.totalDonation || 0)}
          </p>
          <p className="text-[12px] text-text-secondary">Total Donated</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-text-main text-[20px]">
            {donations.length}
          </p>
          <p className="text-[12px] text-text-secondary">Donations</p>
        </Card>
        <Card className="text-center !p-3">
          <p className="font-heading font-bold text-text-main text-[20px]">
            {requests.length}
          </p>
          <p className="text-[12px] text-text-secondary">Book Req.</p>
        </Card>
      </div>

      {/* ── Quick Actions ────────────────────── */}
      <div className="space-y-2 mb-lg">
        <Link to="/app/donate/history">
          <Card className="flex items-center gap-md">
            <div className="w-10 h-10 bg-donate/10 rounded-xl flex items-center justify-center">
              <Heart size={18} className="text-donate" />
            </div>
            <p className="font-medium text-text-main text-small flex-1">
              Donation History
            </p>
            <span className="text-text-light">›</span>
          </Card>
        </Link>

        <Link to="/app/library/requests">
          <Card className="flex items-center gap-md">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-blue-500" />
            </div>
            <p className="font-medium text-text-main text-small flex-1">
              My Book Requests
            </p>
            <span className="text-text-light">›</span>
          </Card>
        </Link>

        <Link to="/app/profile/recurring">
          <Card className="flex items-center gap-md">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <RefreshCw size={18} className="text-purple-500" />
            </div>
            <p className="font-medium text-text-main text-small flex-1">
              Recurring Donations
            </p>
            <span className="text-text-light">›</span>
          </Card>
        </Link>
      </div>

      {/* ── Recent Donations ─────────────────── */}
      {donations.slice(0, 3).length > 0 && (
        <div>
          <h3 className="font-heading text-text-main mb-sm">
            সাম্প্রতিক Donations
          </h3>
          <div className="space-y-2">
            {donations.slice(0, 3).map((d) => (
              <Card
                key={d._id}
                className="flex items-center justify-between gap-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-small font-medium text-text-main truncate">
                    {d.campaign?.title}
                  </p>
                  <p className="text-[12px] text-text-light">
                    {formatDate(d.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-xs flex-shrink-0">
                  <p className="font-bold text-primary text-small">
                    {formatCurrency(d.amount)}
                  </p>
                  <StatusBadge status={d.status} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
