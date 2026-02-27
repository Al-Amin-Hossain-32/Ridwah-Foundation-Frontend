import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { registerUser, clearAuthError, selectAuth } from '@/app/store/authSlice'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'

export default function RegisterPage() {
  const dispatch  = useAppDispatch()
  const navigate  = useNavigate()
  const { loading, error, isLoggedIn } = useAppSelector(selectAuth)

  const [form,   setForm]   = useState({ name: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isLoggedIn) navigate('/app', { replace: true })
  }, [isLoggedIn, navigate])

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
    if (!form.name.trim())           e.name     = 'নাম দিন'
    if (!form.email)                 e.email    = 'Email দিন'
    if (form.password.length < 6)    e.password = 'কমপক্ষে ৬ অক্ষর দিন'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account তৈরি হয়েছে! 🎉')
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-md">
      <div className="fixed top-0 left-0 right-0 h-64 bg-primary opacity-[0.06] rounded-b-[50%]" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-[68px] h-[68px] bg-primary rounded-[18px] mb-md shadow-lg">
            <span className="text-white text-[26px] font-bold font-heading">RF</span>
          </div>
          <h1 style={{ fontSize: 28 }} className="font-heading text-text-main mt-sm">
            Account খুলুন
          </h1>
          <p className="text-text-secondary text-small mt-xs">
            Foundation পরিবারে যোগ দিন
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[20px] p-lg shadow-card">
          <form onSubmit={handleSubmit} className="space-y-md" noValidate>
            <Input
              label="পূর্ণ নাম *"
              name="name"
              type="text"
              placeholder="আপনার সম্পূর্ণ নাম"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              iconLeft={<User size={16} />}
              autoComplete="name"
            />
              <Input
                label="Phone *"
                name="phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={handleChange}
                iconLeft={<Phone size={16} />}
                autoComplete="tel"
              />
            <Input
              label="Email (Optional)"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              iconLeft={<Mail size={16} />}
              autoComplete="email"
            />
            <Input
              label="Password *"
              name="password"
              type="password"
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              iconLeft={<Lock size={16} />}
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading} size="full" className="mt-sm">
              Register করুন
            </Button>
          </form>
        </div>

        <p className="text-center text-text-secondary text-small mt-lg">
          আগে থেকে account আছে?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login করুন
          </Link>
        </p>
      </div>
    </div>
  )
}
