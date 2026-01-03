'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, HardHat, ArrowRight, CheckCircle } from 'lucide-react'

type Step = 'email' | 'login' | 'signup'

const trades = [
  { value: 'other', label: 'Other / Not in construction' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'framer', label: 'Framer' },
  { value: 'drywaller', label: 'Drywaller' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'painter', label: 'Painter' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'mason', label: 'Mason / Bricklayer' },
  { value: 'concrete', label: 'Concrete Finisher' },
  { value: 'ironworker', label: 'Ironworker' },
  { value: 'welder', label: 'Welder' },
  { value: 'glazier', label: 'Glazier' },
  { value: 'insulator', label: 'Insulator' },
  { value: 'flooring', label: 'Flooring Installer' },
  { value: 'tile', label: 'Tile Setter' },
  { value: 'siding', label: 'Siding Installer' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'general_laborer', label: 'General Laborer' },
  { value: 'superintendent', label: 'Superintendent' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'safety_officer', label: 'Safety Officer' },
]

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
  const [trade, setTrade] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Verificar se ja esta logado
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/account')
      }
    }
    checkSession()
  }, [])

  // Verificar se email ja existe - METODO ROBUSTO
  async function checkEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email')
      setLoading(false)
      return
    }

    try {
      // Metodo robusto: tentar login com senha invalida
      // Se retornar "Invalid login credentials" = usuario EXISTE
      // Se retornar outro erro = usuario NAO existe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: '__check_user_exists_invalid_password__',
      })

      if (signInError) {
        const errorMsg = signInError.message.toLowerCase()
        
        // "invalid login credentials" = email existe, senha errada
        if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
          console.log('User EXISTS - going to login step')
          setStep('login')
        } 
        // "email not confirmed" = email existe mas nao confirmado
        else if (errorMsg.includes('email not confirmed')) {
          console.log('User EXISTS but not confirmed - going to login step')
          setStep('login')
        }
        // Qualquer outro erro = usuario nao existe
        else {
          console.log('User does NOT exist - going to signup step')
          setStep('signup')
        }
      } else {
        // Login funcionou (improvavel com senha invalida) - usuario existe
        console.log('Unexpected: login worked - going to account')
        router.push('/account')
      }
    } catch (err) {
      console.error('Check email error:', err)
      // Em caso de erro de rede, assume novo usuario
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
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid')) {
          setError('Incorrect password. Try again or reset your password.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.session) {
        router.push('/account')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password
  async function handleForgotPassword() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/account/settings` }
      )

      if (resetError) throw resetError

      setSuccessMessage('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  // Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()

    // Validacoes
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (!trade) {
      setError('Please select your trade')
      setLoading(false)
      return
    }

    try {
      const birthday = birthYear && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : null

      const fullName = `${firstName.trim()} ${lastName.trim()}`

      // Criar usuario
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            nome: fullName,
            trade: trade,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
          setStep('login')
        } else if (signUpError.message.includes('rate limit') || signUpError.message.includes('429')) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // Aguardar trigger criar o profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Atualizar profile com dados adicionais
        await supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            nome: fullName,
            birthday,
            gender: gender || null,
            trade: trade,
          })
          .eq('id', data.user.id)

        // Fazer login automatico apos signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (loginError) {
          console.error('Auto-login error:', loginError)
          // Se nao conseguir login automatico, mostra tela de login
          setSuccessMessage('Account created! Please sign in.')
          setStep('login')
          return
        }

        // Redirecionar para dashboard
        router.push('/account')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Voltar para email
  function goBack() {
    setStep('email')
    setPassword('')
    setFirstName('')
    setLastName('')
    setTrade('')
    setBirthDay('')
    setBirthMonth('')
    setBirthYear('')
    setGender('')
    setError(null)
    setSuccessMessage(null)
  }

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ]

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 16 - i).toString())

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
              autoComplete="email"
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
              <button type="button" onClick={goBack} className="text-brand-600 text-sm hover:underline mt-1">
                Use a different email
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
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
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full text-brand-600 hover:underline text-sm py-2"
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Step: Signup */}
        {step === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-gray-900 font-semibold text-lg">Create your account</p>
              <p className="text-gray-500 text-sm">for {email}</p>
              <button type="button" onClick={goBack} className="text-brand-600 text-sm hover:underline mt-1">
                Use a different email
              </button>
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
                autoComplete="given-name"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Your trade *</label>
              <select
                required
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Select your trade...</option>
                {trades.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Birthday (optional)</label>
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
                placeholder="Create password (min 8 characters)"
                autoComplete="new-password"
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
              By signing up, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-brand-600 hover:underline">Terms</a> and{' '}
              <a href="/privacy" target="_blank" className="text-brand-600 hover:underline">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              6 months free trial - No credit card required
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
