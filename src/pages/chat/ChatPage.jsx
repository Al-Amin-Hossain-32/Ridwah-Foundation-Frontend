import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Send, Trash2, Pencil,
  Check, X, Info, MoreVertical, CheckCheck, Loader2,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchMessages, fetchOlderMessages,
  sendMessage, editMessage, deleteMessage,
  markAsRead, setActiveConversation,
  selectMessages, selectPagination, selectConversations,
  selectSendLoading, selectMsgLoading, selectIsUserOnline,
} from '@/app/store/chatSlice'
import { selectUser } from '@/app/store/authSlice'
import { useSocket } from '@/hooks/useSocket'
import { Avatar }   from '@/components/ui/Avatar'
import { timeAgo }  from '@/utils/formatters'
import toast        from 'react-hot-toast'

// ── Typing debounce ────────────────────────────────────────────────────────────
function useTypingDebounce(emitTyping, emitStopTyping, receiverId, delay = 1500) {
  const timerRef = useRef(null)
  const handle   = useCallback(() => {
    if (!receiverId) return
    emitTyping(receiverId)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => emitStopTyping(receiverId), delay)
  }, [emitTyping, emitStopTyping, receiverId, delay])
  useEffect(() => () => clearTimeout(timerRef.current), [])
  return handle
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, otherUser, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const isDeleted = msg.isDeleted || msg.content === 'This message was deleted'

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex gap-2 max-w-[78%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && (
          <Avatar src={otherUser?.profilePicture} name={otherUser?.name}
            size="xs" className="mt-auto mb-5 shrink-0" />
        )}

        <div className="flex flex-col gap-0.5">
          <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isDeleted
              ? 'italic opacity-50 bg-gray-100 text-gray-500 rounded-2xl'
              : isMine
              ? 'bg-gradient-to-br from-primary to-emerald-600 text-gray-50 rounded-2xl rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
          }`}>
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            {msg.isEdited && !isDeleted && (
              <span className={`text-[9px] mt-0.5 block ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                edited
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400 font-medium">{timeAgo(msg.createdAt)}</span>
            {isMine && !isDeleted && (
              msg.isRead
                ? <CheckCheck size={11} className="text-blue-400" />
                : <Check size={11} className="text-gray-300" />
            )}
          </div>
        </div>

        {isMine && !isDeleted && (
          <div className={`flex flex-col gap-1 self-center transition-all duration-150 ${
            showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button onClick={() => onEdit(msg)}
              className="p-1 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-blue-500 shadow-sm transition-colors">
              <Pencil size={11} />
            </button>
            <button onClick={() => onDelete(msg._id)}
              className="p-1 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 shadow-sm transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ChatPage ───────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { conversationId } = useParams()
  const dispatch = useAppDispatch()

  const me            = useAppSelector(selectUser)
  const messages      = useAppSelector(selectMessages(conversationId))
  const pagination    = useAppSelector(selectPagination(conversationId))
  const conversations = useAppSelector(selectConversations)
  const sendLoading   = useAppSelector(selectSendLoading)
  const msgLoading    = useAppSelector(selectMsgLoading)

  const conv  = conversations.find((c) => c._id === conversationId)
  const other = conv?.otherUser

  // Real online status from Redux (updated by socket events)
  const isOtherOnline = useAppSelector(selectIsUserOnline(other?._id?.toString() ?? ''))

  const { socket, emitTyping, emitStopTyping, emitMessageRead } = useSocket()

  const [text,         setText]         = useState('')
  const [editingMsg,   setEditingMsg]   = useState(null)
  const [editText,     setEditText]     = useState('')
  const [isOtherTyping, setIsOtherTyping] = useState(false)

  const bottomRef    = useRef(null)
  const topSentinel  = useRef(null)
  const textareaRef  = useRef(null)
  const editInputRef = useRef(null)
  const scrollBoxRef = useRef(null)
  const pinBottom    = useRef(true)

  const handleTypingDebounce = useTypingDebounce(emitTyping, emitStopTyping, other?._id)

  // ── Socket typing ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return
    const onTyping     = ({ userId }) => { if (userId === other?._id?.toString()) setIsOtherTyping(true) }
    const onStopTyping = ({ userId }) => { if (userId === other?._id?.toString()) setIsOtherTyping(false) }
    socket.on('userTyping',        onTyping)
    socket.on('userStoppedTyping', onStopTyping)
    return () => {
      socket.off('userTyping',        onTyping)
      socket.off('userStoppedTyping', onStopTyping)
    }
  }, [socket, other?._id])

  // ── Mount ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return
    pinBottom.current = true
    dispatch(setActiveConversation(conversationId))
    dispatch(fetchMessages(conversationId))
    dispatch(markAsRead(conversationId))
    return () => dispatch(setActiveConversation(null))
  }, [conversationId, dispatch])

  // ── Scroll pin ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollBoxRef.current
    if (!el) return
    const onScroll = () => {
      pinBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // ── Auto scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pinBottom.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isOtherTyping])

  // ── Auto read ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!messages.length) return
    const last     = messages[messages.length - 1]
    const senderId = (last.sender?._id ?? last.sender)?.toString()
    const myId     = me?._id?.toString()
    if (senderId && senderId !== myId && !last.isRead) {
      dispatch(markAsRead(conversationId))
      emitMessageRead(last._id, senderId)
    }
  }, [messages.length])

  // ── Focus edit ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingMsg) setTimeout(() => editInputRef.current?.focus(), 50)
  }, [editingMsg])

  // ── Infinite scroll up ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = topSentinel.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          pagination.hasMore &&
          !pagination.loadingMore &&
          !msgLoading
        ) {
          const scrollEl    = scrollBoxRef.current
          const prevScrollH = scrollEl?.scrollHeight ?? 0
          const nextPage    = (pagination.page ?? 1) + 1
          dispatch(fetchOlderMessages({ conversationId, page: nextPage })).then(() => {
            requestAnimationFrame(() => {
              if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollH
            })
          })
        }
      },
      { root: scrollBoxRef.current, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [pagination.hasMore, pagination.loadingMore, pagination.page, msgLoading, conversationId, dispatch])

  // ── Send ──────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !other?._id || sendLoading) return
    setText('')
    pinBottom.current = true
    textareaRef.current?.focus()
    const result = await dispatch(sendMessage({
      receiverId: other._id, content: trimmed, conversationId,
    }))
    if (sendMessage.rejected.match(result)) {
      setText(trimmed)
      toast.error(result.payload ?? 'Failed to send')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const startEdit  = (msg) => { setEditingMsg(msg); setEditText(msg.content) }
  const cancelEdit = ()    => { setEditingMsg(null); setEditText('') }
  const submitEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === editingMsg.content) return cancelEdit()
    const result = await dispatch(editMessage({ id: editingMsg._id, content: trimmed }))
    if (editMessage.fulfilled.match(result)) toast.success('Message updated')
    else toast.error(result.payload ?? 'Could not edit')
    cancelEdit()
  }
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (msgId) => {
    const msg        = messages.find((m) => m._id === msgId)
    if (!msg) return
    const within5    = Date.now() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000
    const deleteType = within5 ? 'for_everyone' : 'for_me'
    const result     = await dispatch(deleteMessage({ id: msgId, deleteType }))
    if (deleteMessage.fulfilled.match(result))
      toast.success(deleteType === 'for_everyone' ? 'Deleted for everyone' : 'Deleted for you')
    else toast.error(result.payload ?? 'Could not delete')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5]">

      {/* Header */}
      <header className="sticky top-[65px] z-30 h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between  shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/app/chat" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
            to={`/app/user/${other?._id}`}
            className="font-medium text-text-main hover:text-primary transition-colors block truncate"
          >
            <div className="relative">

              <Avatar src={other?.profilePicture} name={other?.name} size="md" />
              {/* Real online status dot */}
              {isOtherOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full block" />
              )}
            </div>
                </Link>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm leading-tight">
                {other?.name ?? '...'}
              </h1>
              <p className={`text-[11px] font-medium ${
                isOtherTyping
                  ? 'text-blue-500'
                  : isOtherOnline
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}>
                {isOtherTyping ? 'typing…' : isOtherOnline ? 'Active' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><Info size={19} /></button>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical size={19} /></button>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollBoxRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 chat-scroll">
        <div ref={topSentinel} className="h-1" />

        {pagination.loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        )}

        {!pagination.hasMore && messages.length > 0 && !msgLoading && (
          <p className="text-center text-[10px] text-gray-300 py-1">— beginning of conversation —</p>
        )}

        {msgLoading && messages.length === 0 ? (
          <div className="flex flex-col gap-4 pt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-9 rounded-2xl bg-gray-200 animate-pulse"
                  style={{ width: `${120 + (i * 37) % 120}px` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Avatar src={other?.profilePicture} name={other?.name} size="xl" className="opacity-40" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Say hi to {other?.name ?? 'them'}! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = (msg.sender?._id ?? msg.sender)?.toString()
            const isMine   = !!senderId && senderId === me?._id?.toString()

            if (editingMsg?._id === msg._id) {
              return (
                <div key={msg._id} className="flex justify-end">
                  <div className="flex flex-col gap-1.5 max-w-[78%] w-full">
                    <textarea ref={editInputRef} value={editText} rows={2}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="w-full text-sm px-4 py-2.5 rounded-2xl border-2 border-blue-400 bg-white focus:outline-none resize-none shadow-sm" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <X size={12} /> Cancel
                      </button>
                      <button onClick={submitEdit}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                        <Check size={12} /> Save
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <MessageBubble key={msg._id} msg={msg} isMine={isMine}
                otherUser={other} onEdit={startEdit} onDelete={handleDelete} />
            )
          })
        )}

        {/* Typing bubble */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <Avatar src={other?.profilePicture} name={other?.name} size="xs" className="shrink-0" />
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-100 p-3 pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea ref={textareaRef} value={text} rows={1}
            onChange={(e) => { setText(e.target.value); if (other?._id) handleTypingDebounce() }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.name ?? ''}…`}
            className="flex-1 bg-transparent border-none focus:outline-emerald-400 text-sm py-1.5 px-1 resize-none max-h-28 chat-scroll text-gray-800 placeholder:text-gray-400" />
          <button onClick={handleSend} disabled={!text.trim() || sendLoading}
            className="mb-0.5 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm">
            {sendLoading
              ? <span className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin block" />
              : <Send size={16} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>

      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
        .chat-scroll:hover::-webkit-scrollbar-thumb { background: #CBD5E1; }
        .pb-safe { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  )
}