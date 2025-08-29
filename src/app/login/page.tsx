'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, AlertCircle, CheckCircle, WifiOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [debugInfo, setDebugInfo] = useState<{ error: string; code?: string; details?: string; hint?: string } | null>(null)
  const router = useRouter()

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test Supabase connection
        const { error } = await supabase.from('stores').select('count').limit(1)
        
        if (error) {
          console.error('Supabase connection error:', error)
          setConnectionStatus('disconnected')
          setDebugInfo({
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
        } else {
          setConnectionStatus('connected')
          setDebugInfo(null)
        }
      } catch (err) {
        console.error('Connection check failed:', err)
        setConnectionStatus('disconnected')
        setDebugInfo({ error: 'Failed to connect to database' })
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    let mounted = true
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return
        
        if (error) {
          console.error('Session check error:', error)
          return
        }
        
        if (data.session) {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('Session check failed:', err)
      }
    }

    checkSession()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/dashboard')
    })
    
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate inputs
    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (connectionStatus === 'disconnected') {
      setError('Cannot connect to database. Please check your connection.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting login with email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log('Login response:', { data, error })

      if (error) {
        console.error('Login error:', error)
        
        // Provide user-friendly error messages
        switch (error.message) {
          case 'Invalid login credentials':
            setError('Invalid email or password. Please check your credentials.')
            break
          case 'Email not confirmed':
            setError('Please check your email and confirm your account before signing in.')
            break
          case 'Too many requests':
            setError('Too many login attempts. Please try again later.')
            break
          default:
            setError(error.message || 'Login failed. Please try again.')
        }
      } else if (data.user) {
        console.log('Login successful, user:', data.user.email)
        router.push('/dashboard')
      } else {
        setError('Login failed. No user data received.')
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Checking connection...'
      case 'connected':
        return 'Connected to database'
      case 'disconnected':
        return 'Database connection failed'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            POSS Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            {getConnectionStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {getConnectionStatusText()}
            </span>
          </div>
          {debugInfo && (
            <div className="mt-2 text-xs text-gray-500">
              <details>
                <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                disabled={loading || connectionStatus === 'disconnected'}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Enter your password"
                  disabled={loading || connectionStatus === 'disconnected'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Login Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || connectionStatus === 'disconnected'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Environment Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Development Info</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
              <div>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
              <div>NODE_ENV: {process.env.NODE_ENV}</div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
