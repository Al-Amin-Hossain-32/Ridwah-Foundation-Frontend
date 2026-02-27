import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchCampaignById, selectCampaignById } from '@/app/store/campaignSlice'
import { submitDonation, selectSubmitLoad }        from '@/app/store/donationSlice'
import donationService from '@/services/donation.service'
import { Button }   from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card }     from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/utils/formatters'

const AMOUNTS = [100, 250, 500, 1000, 2500, 5000]

const METHODS = [
  { value: 'bkash',  label: 'bKash'  },
  { value: 'nagad',  label: 'Nagad'  },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'cash',   label: 'Cash'   },
]

export default function DonateFormPage() {
  const { id }       = useParams()
  const dispatch     = useAppDispatch()
  const navigate     = useNavigate()
  const campaign     = useAppSelector(selectCampaignById)
  const submitLoading = useAppSelector(selectSubmitLoad)

  const [step, setStep]     = useState(1) // 1: amount+method, 2: proof upload
  const [donationId, setDonationId] = useState(null)
  const [proofLoad, setProofLoad]   = useState(false)

  const [form, setForm] = useState({
    amount:        '',
    paymentMethod: '',
    transactionId: '',
    note:          '',
    isAnonymous:   false,
  })
  const [proofFile, setProofFile] = useState(null)
  const [errors, setErrors]       = useState({})

  useEffect(() => {
    if (id) dispatch(fetchCampaignById(id))
  }, [dispatch, id])

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = 'সঠিক পরিমাণ দিন'
    if (!form.paymentMethod)
      e.paymentMethod = 'Payment method select করুন'
    if (!form.transactionId.trim())
      e.transactionId = 'Transaction ID দিন'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = await dispatch(
      submitDonation({
        campaignId:    id,
        amount:        Number(form.amount),
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId,
        note:          form.note,
        isAnonymous:   form.isAnonymous,
      })
    )

    if (submitDonation.fulfilled.match(result)) {
      const donation = result.payload.donation || result.payload
      setDonationId(donation._id)
      setStep(2)
    } else {
      toast.error('Donation submit করা যায়নি')
    }
  }

  const handleProofUpload = async () => {
    if (!proofFile) { toast.error('Screenshot select করুন'); return }
    setProofLoad(true)
    try {
      const fd = new FormData()
      fd.append('proof', proofFile)
      await donationService.uploadProof(donationId, fd)
      toast.success('Donation submit হয়েছে! Approval এর জন্য অপেক্ষা করুন।')
      navigate('/app/donate/history')
    } catch {
      toast.error('Screenshot upload করা যায়নি')
    } finally {
      setProofLoad(false)
    }
  }

  return (
    <div className="page-wrapper">
      {/* Back */}
      <Link
        to={`/app/donate/${id}`}
        className="flex items-center gap-xs text-primary mb-md font-medium text-small"
      >
        <ArrowLeft size={16} /> {campaign?.title || 'Campaign'}
      </Link>

      <h2 className="font-heading text-text-main mb-sm">Donation করুন</h2>

      {campaign && (
        <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} className="mb-lg" />
      )}

      {/* ── Step 1: Form ───────────────────── */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-md" noValidate>

          {/* Quick amounts */}
          <div>
            <label className="text-small font-medium text-text-secondary block mb-sm">
              পরিমাণ (BDT)
            </label>
            <div className="grid grid-cols-3 gap-sm mb-sm">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setField('amount', String(amt))}
                  className={`
                    py-2.5 rounded-btn text-small font-medium border transition-all
                    ${String(form.amount) === String(amt)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-text-secondary border-gray-200 hover:border-primary hover:text-primary'}
                  `}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
            <Input
              placeholder="অথবা নিজে পরিমাণ লিখুন"
              type="number"
              value={form.amount}
              onChange={(e) => setField('amount', e.target.value)}
              error={errors.amount}
              min="1"
            />
          </div>

          <Select
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(e) => setField('paymentMethod', e.target.value)}
            options={METHODS}
            placeholder="-- Method select করুন --"
            error={errors.paymentMethod}
          />

          <Input
            label="Transaction ID"
            placeholder="TXN1234567890"
            value={form.transactionId}
            onChange={(e) => setField('transactionId', e.target.value)}
            error={errors.transactionId}
          />

          <Textarea
            label="Note (optional)"
            placeholder="কোনো বার্তা থাকলে লিখুন..."
            rows={3}
            value={form.note}
            onChange={(e) => setField('note', e.target.value)}
          />

          {/* Anonymous */}
          <label className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setField('isAnonymous', e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-small text-text-secondary">
              Anonymous হিসেবে donate করুন
            </span>
          </label>

          <Button type="submit" loading={submitLoading} size="full" variant="donate">
            Donation Submit করুন
          </Button>
        </form>
      )}

      {/* ── Step 2: Proof Upload ────────────── */}
      {step === 2 && (
        <Card className="text-center space-y-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-heading text-text-main mb-xs">Donation Submitted!</h3>
            <p className="text-small text-text-secondary">
              এখন payment screenshot upload করুন — admin approve করবেন।
            </p>
          </div>

          {/* File input */}
          <label className="block border-2 border-dashed border-primary/30 rounded-card p-lg cursor-pointer hover:border-primary/60 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files[0])}
            />
            {proofFile ? (
              <div className="space-y-xs">
                <img
                  src={URL.createObjectURL(proofFile)}
                  alt="proof"
                  className="w-full h-40 object-cover rounded-btn"
                />
                <p className="text-small text-primary font-medium">{proofFile.name}</p>
              </div>
            ) : (
              <div className="space-y-sm text-text-secondary">
                <Upload size={28} className="mx-auto text-primary/40" />
                <p className="text-small">Screenshot tap করে select করুন</p>
              </div>
            )}
          </label>

          <Button
            onClick={handleProofUpload}
            loading={proofLoad}
            size="full"
            variant="primary"
          >
            Screenshot Upload করুন
          </Button>

          <button
            onClick={() => navigate('/app/donate/history')}
            className="text-small text-text-secondary hover:text-primary transition-colors"
          >
            পরে upload করব →
          </button>
        </Card>
      )}
    </div>
  )
}
