'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingDown, AlertTriangle, Users, DollarSign } from 'lucide-react'

export default function DemoPage() {
  const DEMO_CUSTOMERS = [
    { name: 'Acme Corp', mrr: 4200, score: 23, risk: 'critical', trend: -15, lastSeen: '12 days ago' },
    { name: 'TechFlow Inc', mrr: 1800, score: 41, risk: 'high', trend: -8, lastSeen: '4 days ago' },
    { name: 'StartupXYZ', mrr: 3100, score: 38, risk: 'high', trend: -3, lastSeen: '2 days ago' },
    { name: 'BigCo Ltd', mrr: 9500, score: 72, risk: 'low', trend: +5, lastSeen: '1 hour ago' },
    { name: 'Innovate LLC', mrr: 650, score: 85, risk: 'low', trend: +12, lastSeen: '30 min ago' },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400 bg-red-500/10'
      case 'high': return 'text-orange-400 bg-orange-500/10'
      case 'medium': return 'text-amber-400 bg-amber-500/10'
      default: return 'text-emerald-400 bg-emerald-500/10'
    }
  }

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-red-400'
    if (score < 50) return 'text-orange-400'
    if (score < 70) return 'text-amber-400'
    return 'text-emerald-400'
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xl font-bold">ChurnGuard Demo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Live Dashboard Demo</h1>
          <p className="text-xl text-white/60">See how ChurnGuard tracks customer health in real-time</p>
        </motion.div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/30">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="text-white/30 text-xs ml-2">churnguard.app/dashboard</span>
            <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live · 42 events/min
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/5">
            {[
              { label: 'Total MRR', value: '$47,280', icon: DollarSign, color: 'text-blue-400' },
              { label: 'MRR At Risk', value: '$9,100', icon: AlertTriangle, color: 'text-red-400' },
              { label: 'Critical Risk', value: '3', icon: TrendingDown, color: 'text-red-400' },
              { label: 'Avg Health', value: '61/100', icon: Users, color: 'text-emerald-400' },
            ].map((card) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/3 rounded-xl p-4"
              >
                <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
                <div className="text-xl font-bold">{card.value}</div>
                <div className="text-xs text-white/40 mt-1">{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Customer list */}
          <div className="p-6">
            <div className="text-sm font-medium text-white/60 mb-4">Customers at Risk — sorted by severity</div>
            <div className="space-y-2">
              {DEMO_CUSTOMERS.map((customer, i) => (
                <motion.div
                  key={customer.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-4 bg-white/3 hover:bg-white/5 rounded-xl px-4 py-3 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{customer.name}</div>
                    <div className="text-xs text-white/40">Last seen {customer.lastSeen}</div>
                  </div>
                  <div className="text-sm text-white/60">${customer.mrr.toLocaleString()}/mo</div>
                  <div className={`text-2xl font-bold ${getScoreColor(customer.score)}`}>{customer.score}</div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(customer.risk)}`}>
                    {customer.risk}
                  </div>
                  <div className={`text-xs ${customer.trend < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {customer.trend > 0 ? '+' : ''}{customer.trend} pts
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              title: '⚡ Real-Time Updates',
              description: 'Health scores update instantly as events arrive. No batch delays.'
            },
            {
              title: '🎯 Predictive Insights',
              description: 'AI identifies at-risk customers 30-60 days before they cancel.'
            },
            {
              title: '🔔 Smart Alerts',
              description: 'Get notified via Slack when health drops or churn risk increases.'
            }
          ].map((feature) => (
            <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to protect your revenue?</h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial. No credit card required. See how ChurnGuard catches churn signals before they become cancellations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
              >
                Start Free Trial
              </Link>
              <Link
                href="/"
                className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl transition-all"
              >
                Back Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
