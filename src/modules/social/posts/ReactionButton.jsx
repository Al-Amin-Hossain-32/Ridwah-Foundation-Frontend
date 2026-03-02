import { useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { toggleReaction } from "@/app/store/postSlice";
import { selectUser } from "@/app/store/authSlice";
import reactionService from "@/services/reaction.service";
import { Link } from "react-router-dom";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "লাইক", color: "#2078f4" },
  { type: "love", emoji: "❤️", label: "ভালোবাসা", color: "#f33e58" },
  { type: "haha", emoji: "😂", label: "হাহা", color: "#f7b125" },
  { type: "wow", emoji: "😮", label: "বাহ", color: "#f7b125" },
  { type: "sad", emoji: "😢", label: "দুঃখিত", color: "#f7b125" },
  { type: "angry", emoji: "😡", label: "রাগান্বিত", color: "#e9710f" },
  { type: "dislike", emoji: "👎", label: "ডিসলাইক", color: "#8b8580" },
];

const REACTION_CONFIG = Object.fromEntries(REACTIONS.map((r) => [r.type, r]));

export default function ReactionButton({
  targetType,
  targetId,
  postId,
  userReaction,
  totalReactions = 0,
  reactionCounts = {},

  size = "md",
}) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);

  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  const active = REACTION_CONFIG[userReaction];
  const isSm = size === "sm";

  const onMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setShowPicker(true), 400);
  }, []);

  const onMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setShowPicker(false), 300);
  }, []);

  const handleQuickClick = useCallback(() => {
    clearTimeout(hoverTimer.current);
    if (showPicker) {
      setShowPicker(false);
      return;
    }
    const type = userReaction || "like";
    dispatch(
      toggleReaction({
        targetType,
        targetId,
        reactionType: type,
        postId,
        userId: currentUser?._id,
      }),
    );
  }, [
    userReaction,
    showPicker,
    targetType,
    targetId,
    postId,
    dispatch,
    currentUser,
  ]);

  const handlePickReaction = useCallback(
    (type) => {
      setShowPicker(false);
      dispatch(
        toggleReaction({
          targetType,
          targetId,
          reactionType: type,
          postId,
          userId: currentUser?._id,
        }),
      );
    },
    [targetType, targetId, postId, dispatch, currentUser],
  );

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Reaction Picker */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white rounded-full shadow-xl border border-gray-100 px-3 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={() => clearTimeout(leaveTimer.current)}
          onMouseLeave={onMouseLeave}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => handlePickReaction(r.type)}
              title={r.label}
              className={`text-2xl transition-all duration-150 hover:scale-150 active:scale-125 ${userReaction === r.type ? "scale-125" : ""}`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={handleQuickClick}
        style={active ? { color: active.color } : undefined}
        className={`
          flex items-center gap-1.5 rounded-lg transition-all select-none
          ${isSm ? "text-xs px-2 py-1" : "text-sm px-3 py-2 font-bold"}
          ${active ? "" : "text-gray-600 hover:bg-gray-100"}
        `}
      >
        <span className={isSm ? "text-base" : "text-xl"}>
          {active ? active.emoji : "👍"}
        </span>
        {!isSm && <span>{active ? active.label : "লাইক"}</span>}
      </button>

      {/* Reaction Summary */}
    </div>
  );
}

/**
 * ReactionSummary
 *
 * Hover করলে Facebook-এর মতো reactors-এর avatar tooltip দেখায়।
 * Hover state-এ API call করে reactors আনা হয়।
 */
export function ReactionSummary({
  counts = {},
  total = 0,
  targetType,
  targetId,
  topReactors = [],
}) {
  const [tooltip, setTooltip] = useState(null); // { reactors: [], loading: bool }
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);

  const top3 = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (!total) return null;

  const handleMouseEnter = async () => {
    clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(async () => {
      setVisible(true);
      if (!tooltip) {
        setTooltip({ reactors: [], loading: true });
        try {
          const res = await reactionService.getReactors(
            targetType,
            targetId,
            null,
            20,
          );
          setTooltip({ reactors: res.data.data || [], loading: false });
        } catch {
          setTooltip({ reactors: [], loading: false });
        }
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setVisible(false), 200);
  };

  // Tooltip-এ দেখানোর জন্য filter
  const displayReactors =
    tooltip?.reactors?.filter(
      (r) => activeTab === "all" || r.reactionType === activeTab,
    ) || [];

  // Available tabs — count > 0 যেগুলো
  const availableTabs = [
    { type: "all", label: `সব ${total}` },
    ...Object.entries(counts)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        label: `${REACTION_CONFIG[type]?.emoji} ${count}`,
      })),
  ];

  return (
    <div
      className="relative inline-flex items-center gap-1 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Emoji badges */}
      <div className="flex -space-x-1">
        {/* Avatar stack */}
        {topReactors.length > 0 && (
          <div className="flex -space-x-2 mr-1">
            {topReactors.map((reactor, i) => (
              <div key={i} className="relative">
                <img
                  src={reactor.user?.profilePicture || "/avatar.png"}
                  alt={reactor.user?.name}
                  onError={(e) => {
                    e.currentTarget.src = "/avatar.png";
                  }}
                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                  style={{ zIndex: 10 - i }}
                />
                <span className="absolute -bottom-1 -right-1 text-[9px] leading-none">
                  {REACTION_CONFIG[reactor.reactionType]?.emoji}
                </span>
              </div>
            ))}
          </div>
        )}
        {top3.map(([type]) => (
          <span
            key={type}
            className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow-sm ring-1 ring-gray-100"
          >
            {REACTION_CONFIG[type]?.emoji}
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-500">{total}</span>

      {/* Tooltip */}
      {visible && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden"
          onMouseEnter={() => clearTimeout(leaveTimer.current)}
          onMouseLeave={handleMouseLeave}
          style={{ animation: "fadeInUp 0.15s ease" }}
        >
          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-3 pb-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
            {availableTabs.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`
                  flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                  ${
                    activeTab === tab.type
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reactors list */}
          <div className="max-h-48 overflow-y-auto py-2">
            {tooltip?.loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : displayReactors.length > 0 ? (
              displayReactors.map((reactor, i) => (
                <Link
                  to={`/app/user/${reactor.user?._id}`}
                  className="font-medium text-text-main hover:text-primary transition-colors block truncate"
                >
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={reactor.user?.profilePicture || "/avatar.png"}
                        alt={reactor.user?.name}
                        onError={(e) => {
                          e.currentTarget.src = "/avatar.png";
                        }}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                      />
                      {/* Reaction emoji badge */}
                      <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
                        {REACTION_CONFIG[reactor.reactionType]?.emoji}
                      </span>
                    </div>
                    <span className="text-sm text-gray-800 font-medium truncate">
                      {reactor.user?.name}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-xs text-gray-400 py-4">কেউ নেই</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { REACTIONS, REACTION_CONFIG };
