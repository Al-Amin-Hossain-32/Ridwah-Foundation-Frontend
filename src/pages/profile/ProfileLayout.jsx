import { Outlet, NavLink, useParams } from "react-router-dom";
import { useAppSelector } from "@/hooks/useRedux";
import { selectUser } from "@/app/store/authSlice";
// import ProfileHeader from "./ProfileHeader";
import CreatePost from "../social/CreatePost";
import { FriendButton,  } from "../../modules/friends";
import ProfileHeader from "./ProfileHeader";
export default function ProfileLayout() {
  const { userId } = useParams(); // URL params থেকে userId নিচ্ছি
  const loggedInUser = useAppSelector(selectUser);

  // চেক: যদি URL এ কোন ID না থাকে (নিজস্ব প্রোফাইল রুট) অথবা ID লগইন করা ইউজারের সমান হয়
  const isOwnProfile = !userId || userId === loggedInUser?._id;

  const NAV_ITEMS = [
    { to: "", label: "পোস্ট" },
    { to: "about", label: "তথ্য" },
    { to: "friends", label: "বন্ধু" },
    { to: "donations", label: "দান" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-md">
      <ProfileHeader isOwnProfile={isOwnProfile} />
      {/* Sticky Tab Navigation */}
      <nav className="sticky top-[72px] z-30 bg-card/80 backdrop-blur-md border-y border-gray-100 px-md flex gap-md overflow-x-auto">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={label}
            to={to}
            end={to === ""}
            className={({ isActive }) =>
              `py-md px-sm text-small font-bold transition-all relative ${
                isActive ? "text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary" : "text-text-secondary"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md px-md md:px-0">
        <div className="md:col-span-12 space-y-md">
          {/* ✅ শুধুমাত্র নিজের প্রোফাইলে থাকলেই CreatePost বক্স দেখা যাবে */}
          {isOwnProfile && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <CreatePost />
            </div>
          )}
          
          {/* Child routes (Timeline, About, etc.) */}
          <div className="transition-all duration-300">
            <Outlet context={{ isOwnProfile }} />
          </div>
        </div>
      </div>
    </div>
  );
}