import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { loginUser, clearAuthError, selectAuth } from '@/app/store/authSlice'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'

export default function LoginPage() {
  const dispatch  = useAppDispatch()
  const navigate  = useNavigate()
  const { loading, error, isLoggedIn } = useAppSelector(selectAuth)

  const [form,     setForm]     = useState({ phone: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors,   setErrors]   = useState({})

  // Already logged in? → redirect
  useEffect(() => {
    if (isLoggedIn) navigate('/app', { replace: true })
  }, [isLoggedIn, navigate])

  // Redux error → toast
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearAuthError())
    }
  }, [error, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.phone)    e.phone    = 'Phone নম্বর দিন'
    if (!form.password) e.password = 'Password দিন'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) {
      toast.success(`স্বাগতম! 🎉`)
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-md">
      {/* Background accent */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-primary opacity-[0.06] rounded-b-[50%]" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-[68px] h-[68px] bg-primary rounded-[18px] mb-md shadow-lg">
            <span className="text-white text-[26px] font-bold font-heading">F</span>
          </div>
          <h1 style={{ fontSize: 28 }} className="font-heading text-text-main mt-sm">
            স্বাগতম!
          </h1>
          <p className="text-text-secondary text-small mt-xs">
            আপনার account এ login করুন
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-[20px] p-lg shadow-card">
          <form onSubmit={handleSubmit} className="space-y-md" noValidate>
            <Input
              label="Phone নম্বর"
              name="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              iconLeft={<Mail size={16} />}
              autoComplete="tel"
            />

            <div className="flex flex-col gap-xs">
              <label className="text-small font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="আপনার password"
                  value={form.password}
                  onChange={handleChange}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[14px] text-red-500">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              size="full"
              className="mt-sm"
            >
              Login করুন
            </Button>
          </form>
        </div>

        <p className="text-center text-text-secondary text-small mt-lg">
          Account নেই?{' '}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            Register করুন
          </Link>
        </p>
      </div>
    </div>
  )
}