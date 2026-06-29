'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail, Lock, Chrome } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate auth
    setTimeout(() => {
      setLoading(false)
      alert('Sign in feature coming soon! For MVP, use demo mode.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to ChurnGuard</h1>
          <p className="text-white/60">Sign in to your account or start a free trial</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-white/3 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/3 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-lg transition-colors mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#09090b] text-white/40">or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => alert('Google OAuth coming soon!')}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-white/60">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => alert('Sign up coming soon! Start your 14-day free trial instead.')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign up
          </button>
        </p>

        {/* Demo Mode */}
        <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
          <p className="text-sm text-white/60 mb-2">Want to explore first?</p>
          <Link
            href="/demo"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Try the demo →
          </Link>
        </div>
      </div>
    </div>
  )
}
