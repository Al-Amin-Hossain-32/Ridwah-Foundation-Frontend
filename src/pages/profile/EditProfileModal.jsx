import { useState, useEffect } from 'react'
import { X, User, FileText, Save, Loader2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { selectUser, updateUserData } from '@/app/store/authSlice'
import userService from '@/services/user.service'

export default function EditProfileModal({ isOpen, onClose }) {
  const dispatch = useAppDispatch()
  const user     = useAppSelector(selectUser)

  const [form, setForm]       = useState({ name: '', bio: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm({
        name:     user?.name     || '',
        bio:      user?.bio      || '',
        location: user?.location || '',
      })
      setTouched({})
    }
  }, [isOpen, user])

  // ESC key
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setTouched((p) => ({ ...p, [e.target.name]: true }))
  }

  const isDirty =
    form.name     !== (user?.name     || '') ||
    form.bio      !== (user?.bio      || '') ||
    form.location !== (user?.location || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('নাম দেওয়া আবশ্যক'); return }
    setLoading(true)
    try {
      const res = await userService.update(user._id, form)
      dispatch(updateUserData(res.data.data || res.data.user || form))
      toast.success('প্রোফাইল আপডেট হয়েছে!')
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'আপডেট করা যায়নি')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
        <div
          className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl
            max-h-[85dvh] overflow-y-auto
            animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-heading font-bold text-text-main text-base">
                প্রোফাইল এডিট
              </h2>
              <p className="text-xs text-text-light mt-0.5">
                আপনার তথ্য পরিবর্তন করুন
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors
                text-text-secondary hover:text-text-main shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar preview */}
          <div className="flex items-center gap-3 mx-5 mt-4 p-3 bg-bg rounded-xl">
            <img
              src={user?.profilePicture || '/avatar.png'}
              alt={user?.name}
              onError={(e) => { e.currentTarget.src = '/avatar.png' }}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-text-main text-sm truncate">{user?.name}</p>
              <p className="text-xs text-text-light">ছবি → ক্যামেরা আইকনে ক্লিক করুন</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="px-5 py-4 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">
                পূর্ণ নাম <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="আপনার পূর্ণ নাম"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm
                    bg-bg text-text-main placeholder:text-text-light
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    transition-all
                    ${touched.name && !form.name.trim()
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'}`}
                />
              </div>
              {touched.name && !form.name.trim() && (
                <p className="text-xs text-red-500 mt-1">নাম দেওয়া আবশ্যক</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">
                বায়ো <span className="text-text-light font-normal">(ঐচ্ছিক)</span>
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3 text-text-light pointer-events-none" />
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                  rows={3}
                  maxLength={200}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200
                    hover:border-gray-300 bg-bg text-sm text-text-main
                    placeholder:text-text-light resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    transition-all"
                />
              </div>
              <p className="text-xs text-text-light mt-1 text-right">{form.bio.length}/200</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">
                অবস্থান <span className="text-text-light font-normal">(ঐচ্ছিক)</span>
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="যেমন: ঢাকা, বাংলাদেশ"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200
                    hover:border-gray-300 bg-bg text-sm text-text-main
                    placeholder:text-text-light
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200
                  text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading || !isDirty}
                className="flex-1 flex items-center justify-center gap-2
                  py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
                  shadow-sm hover:bg-primary-dark transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> সেভ হচ্ছে...</>
                  : <><Save size={14} /> সেভ করুন</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}