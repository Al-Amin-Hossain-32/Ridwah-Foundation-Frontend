import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, X, Loader2, MessageCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { sendMessage, selectSendLoading } from '@/app/store/chatSlice'
import { selectIsUserOnline } from '@/app/store/chatSlice'
import { selectUser } from '@/app/store/authSlice'
import { Avatar } from '@/components/ui/Avatar'
import api from '@/services/api'
import toast from 'react-hot-toast'

// ── Single user row ────────────────────────────────────────────────────────────
function UserRow({ user, onSelect, isOnline }) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-100 transition-all text-left"
    >
      <div className="relative shrink-0">
        <Avatar src={user.profilePicture} name={user.name} size="md" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full block" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
        {user.username && (
          <p className="text-xs text-gray-400 truncate">@{user.username}</p>
        )}
      </div>
      <MessageCircle size={16} className="text-blue-400 shrink-0" />
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function NewConversationPage() {
  const dispatch    = useAppDispatch()
  const navigate    = useNavigate()
  const me          = useAppSelector(selectUser)
  const sendLoading = useAppSelector(selectSendLoading)

  const [query,       setQuery]       = useState('')
  const [users,       setUsers]       = useState([])
  const [searching,   setSearching]   = useState(false)
  const [selected,    setSelected]    = useState(null)   // user chosen to message
  const [firstMsg,    setFirstMsg]    = useState('')
  const [sending,     setSending]     = useState(false)

  // ── Debounced user search ──────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setUsers([]); return }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        // Uses your existing user search endpoint
        // Adjust path if yours is different, e.g. /api/users/search?q=...
        const res = await api.get('/users/search', { params: { q: query, limit: 20 } })
        const data = res.data?.data ?? res.data?.users ?? res.data ?? []
        // Exclude self
        setUsers(
          (Array.isArray(data) ? data : []).filter(
            (u) => u._id?.toString() !== me?._id?.toString()
          )
        )
      } catch {
        setUsers([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, me?._id])

  // ── Select a user → show compose panel ────────────────────────────────────
  const handleSelect = (user) => {
    setSelected(user)
    setFirstMsg('')
  }

  // ── Send first message → navigate to chat ─────────────────────────────────
  const handleSend = async () => {
    const trimmed = firstMsg.trim()
    if (!trimmed || !selected?._id || sending) return

    setSending(true)
    const result = await dispatch(sendMessage({
      receiverId: selected._id,
      content:    trimmed,
      // conversationId is unknown yet — backend will findOrCreate
    }))
    setSending(false)

    if (sendMessage.fulfilled.match(result)) {
      const convId =
        result.payload?.conversationId ||
        result.payload?.message?.conversation ||
        null

      toast.success(`Message sent to ${selected.name}`)

      if (convId) {
        navigate(`/app/chat/${convId}`, { replace: true })
      } else {
        // fallback — go to list and let user find the conversation
        navigate('/app/chat', { replace: true })
      }
    } else {
      toast.error(result.payload ?? 'Failed to send message')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Online selector (per user) ─────────────────────────────────────────────
  // We can't call hooks inside a loop, so we pass userId to UserRow
  // and let each row call the selector

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5]">

      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 px-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link to="/app/chat" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold text-gray-900 text-sm">New Message</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* ── If a user is selected, show compose panel ── */}
        {selected ? (
          <div className="space-y-3">
            {/* Selected user chip */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-xs text-gray-400 shrink-0">To:</span>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full pl-1 pr-2 py-0.5">
                <Avatar src={selected.profilePicture} name={selected.name} size="xs" />
                <span className="text-xs font-medium text-blue-700">{selected.name}</span>
                <button onClick={() => setSelected(null)} className="ml-0.5 text-blue-400 hover:text-blue-600">
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Message composer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3 space-y-2">
              <textarea
                value={firstMsg}
                onChange={(e) => setFirstMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={4}
                placeholder={`Write your first message to ${selected.name}…`}
                className="w-full text-sm text-gray-800 placeholder:text-gray-400 border-none focus:ring-0 resize-none bg-transparent"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={!firstMsg.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                >
                  {sending
                    ? <Loader2 size={15} className="animate-spin" />
                    : null}
                  Send
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-300">
              Enter to send · Shift+Enter for new line
            </p>
          </div>

        ) : (
          /* ── Search panel ── */
          <>
            {/* Search input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                placeholder="Search people by name…"
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-300 transition-all placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-gray-300" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-1.5">
                {users.map((user) => (
                  <UserRowWithOnline key={user._id} user={user} onSelect={handleSelect} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                <Search size={30} className="opacity-30" />
                <p className="text-sm">No users found for "{query}"</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                <Search size={30} className="opacity-30" />
                <p className="text-sm font-medium">Search for someone to message</p>
                <p className="text-xs">Type a name to find people</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Wrapper to read online status per user (hooks rule: must be in component) ──
function UserRowWithOnline({ user, onSelect }) {
  const isOnline = useAppSelector(selectIsUserOnline(user._id?.toString() ?? ''))
  return <UserRow user={user} onSelect={onSelect} isOnline={isOnline} />
}