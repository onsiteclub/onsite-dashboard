'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, HardHat, ArrowRight } from 'lucide-react'

type Step = 'email' | 'login' | 'signup'

export default function AuthPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Verificar se email já existe
  async function checkEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (data) {
        setStep('login')
      } else {
        setStep('signup')
      }
    } catch {
      // Email não encontrado = novo usuário
      setStep('signup')
    } finally {
      setLoading(false)
    }
  }

  // Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowForgotPassword(false)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error

      router.push('/account')
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Incorrect password')
      setShowForgotPassword(true)
    } finally {
      setLoading(false)
    }
  }

  // Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      const birthday = birthYear && birthMonth && birthDay 
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : null

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            nome: `${firstName.trim()} ${lastName.trim()}`,
          },
        },
      })
      if (error) throw error

      if (data.user) {
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 180)

        await supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            nome: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim().toLowerCase(),
            birthday,
            gender: gender || null,
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
          })
          .eq('id', data.user.id)
      }

      router.push('/account')
      router.refresh()
    } catch (err: any) {
      console.error('Signup error:', err)
      if (err.message?.includes('already registered')) {
        setError('This email is already registered')
        setStep('login')
      } else {
        setError(err.message || 'An error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  // Forgot password
  async function handleForgotPassword() {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/account/settings` }
      )
      if (error) throw error
      setError('Password reset email sent! Check your inbox.')
      setShowForgotPassword(false)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ]

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString())

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-500 mb-4">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OnSite Club</h1>
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <form onSubmit={checkEmail} className="space-y-4">
            <p className="text-center text-gray-600 mb-4">
              Enter your email to continue
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-lg"
              placeholder="Email"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        {/* Step: Login */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600">Welcome back!</p>
              <p className="font-semibold text-gray-900">{email}</p>
              <button type="button" onClick={() => setStep('email')} className="text-brand-600 text-sm hover:underline">
                Not you?
              </button>
            </div>

            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm ${error.includes('sent') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {showForgotPassword && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-brand-600 hover:underline text-sm"
              >
                Forgot password? Click here to reset
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}

        {/* Step: Signup */}
        {step === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-900 font-semibold text-lg">Create a new account</p>
              <p className="text-gray-500 text-sm">It's quick and easy.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="First name"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="font-semibold text-gray-900 mb-1">{email}</p>
              <button type="button" onClick={() => setStep('email')} className="text-brand-600 text-sm hover:underline">
                Change email
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Birthday</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Month</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Day</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender (optional)</label>
              <div className="flex gap-4">
                {['Female', 'Male', 'Other'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g.toLowerCase()}
                      checked={gender === g.toLowerCase()}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-gray-700">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="New password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By clicking Sign Up, you agree to our{' '}
              <a href="/terms" className="text-brand-600 hover:underline">Terms</a>,{' '}
              <a href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</a> and{' '}
              <a href="/security" className="text-brand-600 hover:underline">Data Policy</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
            </button>

            <p className="text-center text-sm text-gray-500">
              6 months free trial • No credit card required
            </p>
          </form>
        )}
      </div>
    </div>
  )
}