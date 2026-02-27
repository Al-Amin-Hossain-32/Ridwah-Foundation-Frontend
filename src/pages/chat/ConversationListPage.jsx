import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X, RefreshCw, MessageCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchConversations,
  selectConversations,
  selectChatLoading,
  selectUnreadCount,
  selectIsUserOnline,
} from '@/app/store/chatSlice'
import { selectUser } from '@/app/store/authSlice'
import { useSocket } from '@/hooks/useSocket'
import { Avatar }       from '@/components/ui/Avatar'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState }   from '@/components/ui/EmptyState'
import { timeAgo }      from '@/utils/formatters'

// ── Online dot — reads from Redux directly ────────────────────────────────────
function OnlineDot({ userId }) {
  const isOnline = useAppSelector(selectIsUserOnline(userId))
  if (!isOnline) return null
  return (
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full block" />
  )
}
function OfflineDot({ userId }) {
  const isOnline = useAppSelector(selectIsUserOnline(userId))
  if (!isOnline) return (
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 border-2 border-white rounded-full block" />
  )
}

// ── Single row ─────────────────────────────────────────────────────────────────
function ConvRow({ conv, myId }) {
  const other     = conv.otherUser
  const lastMsg   = conv.lastMessage
  const unread    = conv.unreadCount ?? 0
  const hasUnread = unread > 0

  const preview = (() => {
    if (!lastMsg) return 'Start a conversation'
    if (lastMsg.isDeleted || lastMsg.content === 'This message was deleted')
      return '🚫 Message deleted'
    const senderId = (lastMsg.sender?._id ?? lastMsg.sender)?.toString()
    const isMine   = senderId && senderId === myId
    return isMine ? `You: ${lastMsg.content}` : lastMsg.content
  })()

  return (
    <Link to={`/app/chat/${conv._id}`} className="block">
      <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all
        ${hasUnread
          ? 'bg-blue-50 hover:bg-blue-100 border border-blue-100'
          : 'bg-white hover:bg-gray-50 border border-gray-100'
        }`}
      >
        {/* Avatar + online dot */}
        <div className="relative shrink-0">
          <Avatar src={other?.profilePicture} name={other?.name} size="md" />
          <OnlineDot userId={other?._id?.toString()} />
          <OfflineDot userId={other?._id?.toString()} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
              {other?.name ?? 'User'}
            </p>
            <span className={`text-[11px] shrink-0 ${hasUnread ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
              {timeAgo(lastMsg?.createdAt ?? conv.updatedAt)}
            </span>
          </div>
          <p className={`text-[13px] truncate mt-0.5 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
            {preview}
          </p>
        </div>

        {/* Unread badge */}
        {hasUnread && (
          <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[11px] text-white font-bold leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ConversationListPage() {
  const dispatch    = useAppDispatch()
  const convs       = useAppSelector(selectConversations)
  const loading     = useAppSelector(selectChatLoading)
  const totalUnread = useAppSelector(selectUnreadCount)
  const me          = useAppSelector(selectUser)

  // Socket must be active here so online presence & new messages update the list
  useSocket()

  const [search,     setSearch]     = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await dispatch(fetchConversations())
    setRefreshing(false)
  }, [dispatch])

  // Filter by name or last message
  const filtered = convs.filter((conv) => {
    if (!search.trim()) return true
    const q    = search.toLowerCase()
    const name = conv.otherUser?.name?.toLowerCase() ?? ''
    const msg  = conv.lastMessage?.content?.toLowerCase() ?? ''
    return name.includes(q) || msg.includes(q)
  })

  // Unread first, then by updatedAt desc
  const sorted = [...filtered].sort((a, b) => {
    const au = (a.unreadCount ?? 0) > 0 ? 1 : 0
    const bu = (b.unreadCount ?? 0) > 0 ? 1 : 0
    if (bu !== au) return bu - au
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  return (
    <div className="page-wrapper max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-text-main text-xl font-bold">Messages</h2>
          {totalUnread > 0 && (
            <span className="text-xs bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {/* New conversation */}
          <Link
            to="/app/chat/new"
            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-500 transition-colors"
            title="New message"
          >
            <Plus size={20} />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people or messages…"
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:border-blue-300 focus:bg-white transition-all placeholder:text-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {loading && convs.length === 0 ? (
        <CardSkeleton count={5} />
      ) : sorted.length > 0 ? (
        <div className="space-y-1.5">
          {sorted.map((conv) => (
            <ConvRow key={conv._id} conv={conv} myId={me?._id?.toString()} />
          ))}
        </div>
      ) : search ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <Search size={32} className="opacity-30" />
          <p className="text-sm font-medium">No results for "{search}"</p>
          <button onClick={() => setSearch('')} className="text-xs text-blue-500 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <EmptyState
          icon={<MessageCircle size={40} className="opacity-30" />}
          title="No conversations yet"
          description="Start chatting with your friends"
          action={
            <Link to="/app/chat/new"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors">
              <Plus size={16} /> New Message
            </Link>
          }
        />
      )}
    </div>
  )
}