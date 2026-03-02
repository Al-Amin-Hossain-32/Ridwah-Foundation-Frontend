import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { fetchCurrentUser, selectAuth } from "@/app/store/authSlice";
import { fetchUnreadCount } from "@/app/store/chatSlice";
import { ROLES } from "@/constants/roles";

// Layouts
import { AppLayout }    from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/layouts/ProtectedRoute";

// Auth pages
import LoginPage    from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// App pages — Donation module
import CampaignListPage    from "@/pages/donations/CampaignListPage";
import CampaignDetailPage  from "@/pages/donations/CampaignDetailPage";
import DonateFormPage      from "@/pages/donations/DonateFormPage";
import DonationHistoryPage from "@/pages/donations/DonationHistoryPage";

// App pages — Library
import BookListPage    from "@/pages/library/BookListPage";
import BookDetailPage  from "@/pages/library/BookDetailPage";
import MyRequestsPage  from "@/pages/library/MyRequestsPage";

// App pages — Chat
import ConversationListPage from "@/pages/chat/ConversationListPage";
import ChatPage             from "@/pages/chat/ChatPage";
import NewConversationPage  from "@/pages/chat/NewConversationPage";

// App pages — Social
import TimelinePage from "@/pages/social/TimelinePage";
import NewsFeed     from "@/pages/social/NewsFeed";
import FriendList   from "@/pages/social/friends/FriendList";
import PostDetailPage from "@/modules/social/posts/PostDetailPage";

// App pages — Profile
import ProfileLayout   from "@/pages/profile/ProfileLayout";
import ProfilePosts    from "@/pages/profile/submenu/ProfilePosts";
import ProfileAbout    from "@/pages/profile/submenu/ProfileAbout";
import ProfileFriends  from "@/pages/profile/submenu/ProfileFriends";
import ProfileDonations from "@/pages/profile/submenu/ProfileDonations";
import ProfileLibrary  from "@/pages/profile/submenu/ProfileLibrary";
import UserProfilePage from "@/modules/userProfile/UserProfilePage";

// App pages — Friends
import FriendsPage    from "@/modules/friends/pages/FriendsPage";
import RequestsPage   from "@/modules/friends/pages/RequestsPage";
import SuggestionsPage from "@/modules/friends/pages/SuggestionsPage";

// ── User donation pages ────────────────────────────────────────────────────────
import MyRecurringPage  from "@/pages/donations/MyRecurringPage";
import LeaderboardPage  from "@/pages/donations/LeaderboardPage";

// ── Admin / Manager pages ──────────────────────────────────────────────────────
import AdminDashboard      from "@/pages/admin/AdminDashboard";
import DonationManagePage  from "@/pages/admin/DonationManagePage";
import CampaignManagePage  from "@/pages/admin/CampaignManagePage";
import RecurringManagePage from "@/pages/admin/RecurringManagePage";
import AnalyticsPage       from "@/pages/admin/AnalyticsPage";

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector(selectAuth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
      dispatch(fetchUnreadCount());
    }
  }, [token, dispatch]);

  return (
    <Routes>
      {/* ── Public ───────────────── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected App ────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>

          {/* Home */}
          <Route path="/app" element={<NewsFeed />} />

          {/* Donate */}
          <Route path="/app/donate"          element={<CampaignListPage />} />
          <Route path="/app/donate/:id"      element={<CampaignDetailPage />} />
          <Route path="/app/donate/:id/pay"  element={<DonateFormPage />} />
          <Route path="/app/donate/history"     element={<DonationHistoryPage />} />
          <Route path="/app/recurring"          element={<MyRecurringPage />} />
          <Route path="/app/donate/leaderboard" element={<LeaderboardPage />} />

          {/* Library */}
          <Route path="/app/library"          element={<BookListPage />} />
          <Route path="/app/library/:id"      element={<BookDetailPage />} />
          <Route path="/app/library/requests" element={<MyRequestsPage />} />

          {/* Chat */}
          <Route path="/app/chat"                      element={<ConversationListPage />} />
          <Route path="/app/chat/:conversationId"      element={<ChatPage />} />
          <Route path="/app/chat/new"                  element={<NewConversationPage />} />

          {/* Social */}
          <Route path="/app/social"         element={<TimelinePage />} />
          <Route path="/app/social/friends" element={<FriendList />} />
          <Route path="/app/post/:postId"   element={<PostDetailPage />} />

          {/* Profile */}
          <Route path="/app/profile" element={<ProfileLayout />}>
            <Route index          element={<ProfilePosts />} />
            <Route path="about"   element={<ProfileAbout />} />
            <Route path="friends" element={<ProfileFriends />} />
            <Route path="donations" element={<ProfileDonations />} />
            <Route path="library" element={<ProfileLibrary />} />
          </Route>
          <Route path="/app/user/:userId" element={<UserProfilePage />} />

          {/* Friends */}
          <Route path="/app/friends"             element={<FriendsPage />} />
          <Route path="/app/friends/requests"    element={<RequestsPage />} />
          <Route path="/app/friends/suggestions" element={<SuggestionsPage />} />

          {/* ── Manager + Admin only ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]} />}>
            <Route path="/app/admin"            element={<AdminDashboard />} />
            <Route path="/app/admin/donations"  element={<DonationManagePage />} />
            <Route path="/app/admin/campaigns"  element={<CampaignManagePage />} />
            <Route path="/app/admin/recurring"  element={<RecurringManagePage />} />
            <Route path="/app/admin/analytics"  element={<AnalyticsPage />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}