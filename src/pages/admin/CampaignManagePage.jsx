import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Upload, Target, Calendar, X, AlertTriangle,
  CheckCircle, Clock, RefreshCw, ImagePlus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  fetchCampaigns, createCampaign, updateCampaign, deleteCampaign,
  selectCampaigns, selectCampaignLoad,
} from '@/app/store/campaignSlice'
import campaignService from '@/services/campaign.service'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/mottion'

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    icon: Clock },
  completed: { label: 'সম্পন্ন',  color: 'bg-blue-100 text-blue-700',   icon: CheckCircle },
  expired:   { label: 'মেয়াদোত্তীর্ণ', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
}

const EMPTY_FORM = {
  title: '', description: '', goalAmount: '',
  startDate: '', endDate: '', status: 'draft',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignFormModal({ campaign, onClose, onSaved }) {
  const dispatch = useAppDispatch()
  const isEdit = !!campaign

  const [form, setForm]     = useState(
    isEdit ? {
      title:       campaign.title,
      description: campaign.description,
      goalAmount:  String(campaign.goalAmount),
      startDate:   campaign.startDate?.slice(0, 10) || '',
      endDate:     campaign.endDate?.slice(0, 10)   || '',
      status:      campaign.status,
    } : EMPTY_FORM
  )
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverLoad, setCoverLoad] = useState(false)

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())             e.title       = 'শিরোনাম দিন'
    if (!form.description.trim())       e.description = 'বিবরণ দিন'
    if (!form.goalAmount || isNaN(form.goalAmount) || Number(form.goalAmount) < 100)
                                        e.goalAmount  = 'ন্যূনতম ১০০ টাকা'
    if (!form.startDate)                e.startDate   = 'শুরুর তারিখ দিন'
    if (!form.endDate)                  e.endDate     = 'শেষ তারিখ দিন'
    if (form.startDate && form.endDate && form.startDate >= form.endDate)
                                        e.endDate     = 'শেষ তারিখ পরে হতে হবে'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        goalAmount: Number(form.goalAmount),
      }
      let savedId
      if (isEdit) {
        const res = await dispatch(updateCampaign({ id: campaign._id, data: payload }))
        savedId = campaign._id
        if (!updateCampaign.fulfilled.match(res)) throw new Error('Update failed')
        toast.success('Campaign আপডেট হয়েছে')
      } else {
        const res = await dispatch(createCampaign(payload))
        if (!createCampaign.fulfilled.match(res)) throw new Error(res.payload || 'Create failed')
        // Backend: { success, data: campaign } → payload = { success, data }
        const created = res.payload?.data || res.payload?.campaign || res.payload
        savedId = created?._id
        toast.success('Campaign তৈরি হয়েছে')
      }

      // Upload cover if selected
      if (coverFile && savedId) {
        setCoverLoad(true)
        const fd = new FormData()
        fd.append('cover', coverFile)
        await campaignService.uploadCover(savedId, fd)
        setCoverLoad(false)
      }

      onSaved()
      onClose()
    } catch {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 250 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-heading font-semibold text-text-main">
            {isEdit ? 'Campaign সম্পাদনা' : 'নতুন Campaign'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Title */}
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">শিরোনাম *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Campaign এর নাম..."
              className={cn(
                'w-full border rounded-xl px-3.5 py-2.5 text-small text-text-main focus:outline-none transition-colors',
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
              )}
            />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">বিবরণ *</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Campaign সম্পর্কে বিস্তারিত..."
              rows={4}
              className={cn(
                'w-full border rounded-xl px-3.5 py-2.5 text-small text-text-main resize-none focus:outline-none transition-colors',
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
              )}
            />
            {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Goal amount */}
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">লক্ষ্যমাত্রা (BDT) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light text-small font-medium">৳</span>
              <input
                type="number"
                value={form.goalAmount}
                onChange={(e) => set('goalAmount', e.target.value)}
                placeholder="0"
                min="100"
                className={cn(
                  'w-full border rounded-xl pl-8 pr-3.5 py-2.5 text-small text-text-main focus:outline-none transition-colors',
                  errors.goalAmount ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
                )}
              />
            </div>
            {errors.goalAmount && <p className="text-[11px] text-red-500 mt-1">{errors.goalAmount}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">শুরুর তারিখ *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={cn(
                  'w-full border rounded-xl px-3 py-2.5 text-small text-text-main focus:outline-none transition-colors',
                  errors.startDate ? 'border-red-300' : 'border-gray-200 focus:border-primary'
                )}
              />
              {errors.startDate && <p className="text-[11px] text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">শেষ তারিখ *</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={cn(
                  'w-full border rounded-xl px-3 py-2.5 text-small text-text-main focus:outline-none transition-colors',
                  errors.endDate ? 'border-red-300' : 'border-gray-200 focus:border-primary'
                )}
              />
              {errors.endDate && <p className="text-[11px] text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">অবস্থা</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-small text-text-main focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Cover image */}
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1.5">Cover Image</label>
            <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => setCoverFile(e.target.files[0])} />
              <ImagePlus size={18} className="text-text-light" />
              <span className="text-small text-text-secondary">
                {coverFile ? coverFile.name : isEdit && campaign.coverImage?.url ? 'নতুন ছবি বদলান' : 'ছবি বেছে নিন'}
              </span>
            </label>
            {coverFile && (
              <img src={URL.createObjectURL(coverFile)} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading || coverLoad}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-small hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {(loading || coverLoad) && <RefreshCw size={16} className="animate-spin" />}
            {loading ? 'সংরক্ষণ হচ্ছে...' : coverLoad ? 'ছবি আপলোড হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'Campaign তৈরি করুন'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE CONFIRM
// ═══════════════════════════════════════════════════════════════════════════════
function DeleteConfirm({ campaign, onConfirm, onClose, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl"
      >
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="font-heading font-semibold text-text-main text-center mb-1">Campaign মুছুন?</h3>
        <p className="text-small text-text-secondary text-center mb-5">
          "{campaign.title}" মুছে ফেলা হবে। এই কাজ ফেরানো যাবে না।
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-small font-medium text-text-secondary">
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-small font-bold hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'মুছুন'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN CARD
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignRow({ campaign, onEdit, onDelete, onToggle, toggling }) {
  const statusStyle = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft
  const StatusIcon  = statusStyle.icon
  const progress    = campaign.progressPercentage || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
    >
      {/* Cover strip */}
      {campaign.coverImage?.url && (
        <div className="h-32 overflow-hidden">
          <img src={campaign.coverImage.url} alt={campaign.title}
               className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-4">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-heading font-semibold text-text-main leading-snug flex-1 line-clamp-2">
            {campaign.title}
          </h3>
          <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', statusStyle.color)}>
            <StatusIcon size={10} />
            {statusStyle.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-text-secondary">{formatCurrency(campaign.currentAmount || 0)} সংগ্রহ</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
          <div className="flex justify-between text-[11px] mt-1 text-text-light">
            <span>লক্ষ্য: {formatCurrency(campaign.goalAmount)}</span>
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {campaign.daysRemaining > 0 ? `${campaign.daysRemaining} দিন বাকি` : 'শেষ হয়েছে'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {/* Toggle active */}
          <button
            onClick={() => onToggle(campaign)}
            disabled={toggling === campaign._id}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors',
              campaign.isActive
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            )}
          >
            {toggling === campaign._id
              ? <RefreshCw size={13} className="animate-spin" />
              : campaign.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />
            }
            {campaign.isActive ? 'Active' : 'Inactive'}
          </button>

          <div className="flex gap-1.5 ml-auto">
            <button
              onClick={() => onEdit(campaign)}
              className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(campaign)}
              className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CampaignManagePage() {
  const dispatch   = useAppDispatch()
  const campaigns  = useAppSelector(selectCampaigns)
  const loading    = useAppSelector(selectCampaignLoad)

  const [showForm,     setShowForm]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoad,   setDeleteLoad]   = useState(false)
  const [toggling,     setToggling]     = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    dispatch(fetchCampaigns(statusFilter ? { status: statusFilter } : {}))
  }, [dispatch, statusFilter])

  const handleToggle = useCallback(async (campaign) => {
    setToggling(campaign._id)
    await dispatch(updateCampaign({
      id: campaign._id,
      data: { isActive: !campaign.isActive },
    }))
    setToggling(null)
  }, [dispatch])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoad(true)
    const res = await dispatch(deleteCampaign(deleteTarget._id))
    setDeleteLoad(false)
    setDeleteTarget(null)
    if (deleteCampaign.fulfilled.match(res)) {
      toast.success('Campaign মুছে ফেলা হয়েছে')
    } else {
      toast.error(res.payload || 'মুছতে পারা যায়নি')
    }
  }, [dispatch, deleteTarget])

  const openEdit = (c) => { setEditTarget(c); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditTarget(null) }

  const STATUS_TABS = [
    { value: '',          label: 'সবগুলো' },
    { value: 'active',    label: 'Active' },
    { value: 'draft',     label: 'Draft' },
    { value: 'completed', label: 'সম্পন্ন' },
    { value: 'expired',   label: 'মেয়াদোত্তীর্ণ' },
  ]

  return (
    <div className="space-y-md pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-text-main text-h2">Campaign ব্যবস্থাপনা</h2>
          <p className="text-small text-text-secondary mt-xs">{campaigns.length}টি campaign</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-small font-bold hover:bg-primary-dark transition-colors shadow-sm active:scale-95"
        >
          <Plus size={17} />
          নতুন
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-small font-semibold whitespace-nowrap transition-all flex-shrink-0',
              statusFilter === t.value
                ? 'bg-primary text-white'
                : 'bg-white text-text-secondary border border-gray-200 hover:border-primary/30'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Target size={40} className="text-text-light mx-auto mb-3" />
          <p className="font-semibold text-text-secondary">কোনো campaign নেই</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-primary text-small font-medium">
            প্রথম Campaign তৈরি করুন →
          </button>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {campaigns.map((c) => (
              <CampaignRow
                key={c._id}
                campaign={c}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <CampaignFormModal
            campaign={editTarget}
            onClose={closeForm}
            onSaved={() => dispatch(fetchCampaigns(statusFilter ? { status: statusFilter } : {}))}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            campaign={deleteTarget}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
            loading={deleteLoad}
          />
        )}
      </AnimatePresence>
    </div>
  )
}