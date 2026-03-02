import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Upload, CheckCircle, RefreshCw,
  Zap, Heart, Calendar, ChevronDown, X, Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchCampaignById, selectCampaignById } from '@/app/store/campaignSlice'
import { submitDonation, selectSubmitLoad }         from '@/app/store/donationSlice'
import { createRecurring, selectRecurringAction }   from '@/app/store/recurringDonationSlice'
import { selectUser }                               from '@/app/store/authSlice'
import donationService                              from '@/services/donation.service'
import { formatCurrency }                           from '@/utils/formatters'
import { cn }                                       from '@/utils/mottion'

// ─── Config ────────────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]

const PAYMENT_METHODS = [
  { value: 'bkash',  label: 'bKash',  icon: '💜' },
  { value: 'nagad',  label: 'Nagad',  icon: '🟠' },
  { value: 'rocket', label: 'Rocket', icon: '🟣' },
  { value: 'bank',   label: 'Bank',   icon: '🏦' },
  { value: 'cash',   label: 'Cash',   icon: '💵' },
]

const FREQ_OPTIONS = [
  { value: 'monthly',   label: 'মাসিক',      sub: 'প্রতি মাসে',  color: 'border-teal-400 bg-teal-50 text-teal-700'    },
  { value: 'quarterly', label: 'ত্রৈমাসিক', sub: 'প্রতি ৩ মাসে', color: 'border-violet-400 bg-violet-50 text-violet-700' },
  { value: 'yearly',    label: 'বার্ষিক',    sub: 'প্রতি বছরে',  color: 'border-amber-400 bg-amber-50 text-amber-700'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fieldErr = (errors, key) =>
  errors[key] ? (
    <p className="text-[11px] text-red-500 mt-1">{errors[key]}</p>
  ) : null

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function CampaignProgress({ campaign }) {
  if (!campaign) return null
  const pct = Math.min(
    Math.round(((campaign.currentAmount || 0) / (campaign.goalAmount || 1)) * 100),
    100
  )
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
      <div className="flex justify-between items-center mb-2">
        <p className="text-small font-semibold text-text-main truncate flex-1 mr-3">{campaign.title}</p>
        <span className="font-heading font-black text-primary text-small flex-shrink-0">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-text-light">
        <span>{formatCurrency(campaign.currentAmount || 0)} সংগ্রহ</span>
        <span>লক্ষ্য {formatCurrency(campaign.goalAmount)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — AMOUNT + METHOD FORM
// ═══════════════════════════════════════════════════════════════════════════════
function DonationForm({ campaignId, campaign, onSuccess }) {
  const dispatch      = useAppDispatch()
  const user          = useAppSelector(selectUser)
  const submitLoading = useAppSelector(selectSubmitLoad)
  const recurringLoad = useAppSelector(selectRecurringAction)

  const [donationType, setDonationType] = useState('one-time') // 'one-time' | 'recurring'
  const [form, setForm] = useState({
    amount: '', method: '', reference: '', note: '',
    isAnonymous: false, frequency: 'monthly',
  })
  const [errors, setErrors] = useState({})

  const set = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }, [])

  const validate = () => {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'সঠিক পরিমাণ দিন'
    if (donationType === 'recurring' && amt < 50)  e.amount = 'নিয়মিত donation ন্যূনতম ৳৫০'
    if (donationType === 'one-time'  && amt < 10)  e.amount = 'ন্যূনতম ৳১০'
    if (!form.method)    e.method    = 'Payment method বেছে নিন'
    if (donationType === 'one-time' && !form.reference.trim()) e.reference = 'Transaction ID দিন'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (donationType === 'recurring') {
      // Create recurring subscription
      const res = await dispatch(createRecurring({
        amount:        Number(form.amount),
        frequency:     form.frequency,
        campaignId:    campaignId || undefined,
        paymentMethod: form.method,
        isAnonymous:   form.isAnonymous,
      }))
      if (createRecurring.fulfilled.match(res)) {
        toast.success('নিয়মিত donation সাবস্ক্রিপশন তৈরি হয়েছে! 🎉')
        onSuccess({ type: 'recurring', id: res.payload?.data?._id })
      } else {
        toast.error(res.payload || 'সমস্যা হয়েছে')
      }
    } else {
      // One-time donation
      const res = await dispatch(submitDonation({
        campaignId,
        amount:          Number(form.amount),
        paymentMethod:   form.method,
        paymentReference: form.reference,
        message:         form.note,
        isAnonymous:     form.isAnonymous,
      }))
      if (submitDonation.fulfilled.match(res)) {
        const donation = res.payload?.donation || res.payload
        onSuccess({ type: 'one-time', id: donation?._id })
      } else {
        toast.error('Donation submit করা যায়নি')
      }
    }
  }

  const loading = submitLoading || recurringLoad

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* ── Donation type toggle ── */}
      <div className="bg-gray-50 rounded-2xl p-1.5 flex gap-1.5">
        {[
          { value: 'one-time',  label: 'এককালীন', icon: Heart },
          { value: 'recurring', label: 'নিয়মিত',  icon: RefreshCw, requiresLogin: true },
        ].map(({ value, label, icon: Icon, requiresLogin }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (requiresLogin && !user) { toast.error('নিয়মিত donation এর জন্য login করুন'); return }
              setDonationType(value)
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-small font-bold transition-all',
              donationType === value
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            )}
          >
            <Icon size={15} />
            {label}
            {requiresLogin && !user && (
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-normal">Login</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Recurring info banner ── */}
      <AnimatePresence>
        {donationType === 'recurring' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
              <Info size={15} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-primary leading-relaxed">
                নিয়মিত donation এ আপনি প্রতি মাসে/ত্রৈমাসিকে/বার্ষিক নির্দিষ্ট পরিমাণ দান করতে পারবেন। যেকোনো সময় বিরতি বা বাতিল করা যাবে।
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Frequency selector (recurring only) ── */}
      <AnimatePresence>
        {donationType === 'recurring' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div>
              <label className="text-[12px] font-semibold text-text-secondary block mb-2">কত ঘন ঘন?</label>
              <div className="grid grid-cols-3 gap-2">
                {FREQ_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set('frequency', f.value)}
                    className={cn(
                      'py-3 px-2 rounded-xl border-2 text-center transition-all',
                      form.frequency === f.value ? f.color : 'border-gray-100 bg-white text-text-secondary'
                    )}
                  >
                    <p className="text-[12px] font-bold">{f.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{f.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Amount ── */}
      <div>
        <label className="text-[12px] font-semibold text-text-secondary block mb-2">পরিমাণ (BDT)</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => set('amount', String(amt))}
              className={cn(
                'py-2.5 rounded-xl text-small font-bold border-2 transition-all active:scale-95',
                String(form.amount) === String(amt)
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-text-secondary border-gray-100 hover:border-primary/40'
              )}
            >
              {formatCurrency(amt)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light font-medium text-small">৳</span>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="অথবা নিজে লিখুন"
            min="1"
            className={cn(
              'w-full border rounded-xl pl-8 pr-4 py-2.5 text-small text-text-main focus:outline-none transition-colors',
              errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
            )}
          />
        </div>
        {fieldErr(errors, 'amount')}
      </div>

      {/* ── Payment method ── */}
      <div>
        <label className="text-[12px] font-semibold text-text-secondary block mb-2">Payment Method</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => set('method', m.value)}
              className={cn(
                'flex flex-col items-center py-3 rounded-xl border-2 transition-all active:scale-95',
                form.method === m.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <span className="text-[18px] mb-1">{m.icon}</span>
              <span className={cn('text-[11px] font-bold', form.method === m.value ? 'text-primary' : 'text-text-secondary')}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
        {fieldErr(errors, 'method')}
      </div>

      {/* ── Transaction reference (one-time only) ── */}
      <AnimatePresence>
        {donationType === 'one-time' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div>
              <label className="text-[12px] font-semibold text-text-secondary block mb-2">
                Transaction ID <span className="text-red-400">*</span>
              </label>
              <input
                value={form.reference}
                onChange={(e) => set('reference', e.target.value)}
                placeholder="TXN1234567890"
                className={cn(
                  'w-full border rounded-xl px-4 py-2.5 text-small text-text-main font-mono focus:outline-none transition-colors',
                  errors.reference ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-primary'
                )}
              />
              {fieldErr(errors, 'reference')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Note ── */}
      <div>
        <label className="text-[12px] font-semibold text-text-secondary block mb-2">
          বার্তা <span className="text-text-light font-normal">(optional)</span>
        </label>
        <textarea
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="কোনো বার্তা থাকলে লিখুন..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-small text-text-main resize-none focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* ── Anonymous ── */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => set('isAnonymous', !form.isAnonymous)}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
            form.isAnonymous ? 'bg-primary border-primary' : 'border-gray-300'
          )}
        >
          {form.isAnonymous && <CheckCircle size={12} className="text-white" />}
        </div>
        <span className="text-small text-text-secondary">Anonymous হিসেবে donate করুন</span>
      </label>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-donate text-white rounded-xl font-black text-[16px] flex items-center justify-center gap-2.5 disabled:opacity-60 active:scale-[0.98] transition-transform shadow-donate hover:shadow-donate-hover"
      >
        {loading
          ? <RefreshCw size={18} className="animate-spin" />
          : donationType === 'recurring' ? <RefreshCw size={18} /> : <Zap size={18} />
        }
        {loading
          ? 'প্রক্রিয়া হচ্ছে...'
          : donationType === 'recurring'
            ? `${form.frequency === 'monthly' ? 'মাসিক' : form.frequency === 'quarterly' ? 'ত্রৈমাসিক' : 'বার্ষিক'} Donation শুরু করুন`
            : 'Donation Submit করুন'
        }
      </button>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — PROOF UPLOAD (one-time only)
// ═══════════════════════════════════════════════════════════════════════════════
function ProofUpload({ donationId, onDone }) {
  const navigate   = useAppDispatch()
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const nav = useNavigate()

  const handleUpload = async () => {
    if (!file) { toast.error('Screenshot বেছে নিন'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('proof', file)
      await donationService.uploadProof(donationId, fd)
      toast.success('সফলভাবে submit হয়েছে! অনুমোদনের অপেক্ষায় আছে ✓')
      nav('/app/donate/history')
    } catch {
      toast.error('Upload করা যায়নি')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Success badge */}
      <div className="flex flex-col items-center pt-4 pb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle size={40} className="text-secondary" />
        </motion.div>
        <h3 className="font-heading font-bold text-text-main text-[20px]">Donation Submit!</h3>
        <p className="text-small text-text-secondary mt-1 text-center">
          এখন payment screenshot upload করুন — manager approve করবেন।
        </p>
      </div>

      {/* File picker */}
      <label className="block border-2 border-dashed border-primary/30 rounded-2xl p-6 cursor-pointer hover:border-primary/60 transition-colors text-center">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file ? (
          <div className="space-y-3">
            <img
              src={URL.createObjectURL(file)}
              alt="proof preview"
              className="w-full h-44 object-cover rounded-xl"
            />
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={14} className="text-secondary" />
              <p className="text-small text-primary font-medium truncate max-w-[200px]">{file.name}</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setFile(null) }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={13} className="text-text-light" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-text-secondary py-4">
            <Upload size={28} className="mx-auto text-primary/30" />
            <p className="text-small font-medium">Screenshot tap করে বেছে নিন</p>
            <p className="text-[11px] text-text-light">JPG, PNG — সর্বোচ্চ 5MB</p>
          </div>
        )}
      </label>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold text-small flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
      >
        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
        {loading ? 'Upload হচ্ছে...' : 'Screenshot Upload করুন'}
      </button>

      <button
        onClick={() => nav('/app/donate/history')}
        className="w-full py-3 text-small text-text-secondary hover:text-primary transition-colors"
      >
        পরে upload করব →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DonateFormPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const dispatch  = useAppDispatch()
  const campaign  = useAppSelector(selectCampaignById)

  const [step,       setStep]       = useState(1)
  const [donationId, setDonationId] = useState(null)
  const [doneType,   setDoneType]   = useState(null)

  useEffect(() => {
    if (id) dispatch(fetchCampaignById(id))
  }, [dispatch, id])

  const handleSuccess = useCallback(({ type, id: dId }) => {
    setDoneType(type)
    if (type === 'one-time') {
      setDonationId(dId)
      setStep(2)
    } else {
      // Recurring — go straight to history
      navigate('/app/recurring')
    }
  }, [navigate])

  return (
    <div className="page-wrapper pb-8">

      {/* Back */}
      <Link
        to={id ? `/app/donate/${id}` : '/app/donate'}
        className="inline-flex items-center gap-1.5 text-primary text-small font-medium mb-5"
      >
        <ArrowLeft size={16} />
        {campaign?.title || 'Campaigns'}
      </Link>

      <h2 className="font-heading font-bold text-text-main text-h2 mb-md">
        {step === 1 ? 'Donation করুন' : 'Payment Proof'}
      </h2>

      {/* Campaign progress */}
      {step === 1 && campaign && <div className="mb-5"><CampaignProgress campaign={campaign} /></div>}

      {/* Steps */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <DonationForm
              campaignId={id}
              campaign={campaign}
              onSuccess={handleSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            key="proof"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ProofUpload donationId={donationId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}