import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Users } from "lucide-react";
import { fetchFriends } from "../friend.thunks";
import { selectFriends, selectFriendLoading } from "../friendSlice";
import FriendCard from "../components/FriendCard";
import FriendTabs from "../components/FriendTabs";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";

const FriendsPage = () => {
  const dispatch = useDispatch();
  const friends = useSelector(selectFriends);
  const { friends: isLoading } = useSelector(selectFriendLoading);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg p-4 max-w-2xl mx-auto">
      <h1 className="text-h2 font-heading text-text-main mb-4">আমার বন্ধুরা</h1>

      <FriendTabs />

      <div className="space-y-3">
        {isLoading && <SkeletonCard count={4} />}

        {!isLoading && friends.length === 0 && (
          <EmptyState
            icon={Users}
            title="এখনো কোনো বন্ধু নেই"
            subtitle="সাজেশন থেকে নতুন বন্ধু খুঁজুন"
          />
        )}

        {!isLoading &&
          friends
            .filter((f) => f && f._id) // ← null guard
            .map((friend) => <FriendCard key={friend._id} friend={friend} />)}
      </div>
    </div>
  );
};

export default FriendsPage;
