'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight, TrendingDown, AlertTriangle, Users, DollarSign,
  BarChart3, Zap, Shield, Globe, CheckCircle2
} from 'lucide-react'

const RISK_STATS = [
  { label: 'Avg Monthly Churn Rate', value: '5-7%', sub: 'for SaaS companies without health monitoring' },
  { label: 'Detection Lead Time', value: '0 days', sub: 'companies discover churn AFTER cancellation' },
  { label: 'Preventable Churn', value: '30-50%', sub: 'of churn could be prevented with early intervention' },
  { label: 'Revenue At Risk', value: '$100K', sub: 'per month for a $1M ARR company at 10% churn' },
]

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-Time Health Scoring',
    description: '15 behavioral signals → 0-100 health score, updated every time a customer event is ingested. Aurora DSQL ensures scores are globally consistent in milliseconds.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: TrendingDown,
    title: 'Predictive Churn Risk',
    description: 'ML model identifies customers at risk 30-60 days before they cancel. Catch the signals: declining logins, shrinking feature usage, increasing support tickets.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: Zap,
    title: 'Automated Playbooks',
    description: 'When health drops below threshold → automatically send Slack alert to CSM, trigger email sequence, or assign a task. Human actions at machine speed.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Globe,
    title: 'Aurora DSQL: Globally Distributed',
    description: 'Your customers are worldwide. Aurora DSQL active-active replication means events from Tokyo, London, and New York all update health scores with strong consistency — no eventual consistency trade-offs.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

const CUSTOMERS_MOCK = [
  { name: 'Acme Corp', mrr: 4200, score: 23, risk: 'critical', trend: -15, lastSeen: '12 days ago' },
  { name: 'TechFlow Inc', mrr: 1800, score: 41, risk: 'high', trend: -8, lastSeen: '4 days ago' },
  { name: 'StartupXYZ', mrr: 3100, score: 38, risk: 'high', trend: -3, lastSeen: '2 days ago' },
  { name: 'BigCo Ltd', mrr: 9500, score: 72, risk: 'low', trend: +5, lastSeen: '1 hour ago' },
  { name: 'Innovate LLC', mrr: 650, score: 85, risk: 'low', trend: +12, lastSeen: '30 min ago' },
]

const PRICING = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    features: ['Up to 100 tracked customers', 'Health score dashboard', 'Email alerts', '3 playbooks', 'REST API + SDK'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$199',
    period: '/month',
    features: ['Up to 1,000 customers', 'Predictive churn scoring', 'Slack integration', 'Unlimited playbooks', 'Revenue analytics', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited customers', 'Custom ML models', 'SSO/SAML', 'Dedicated CSM', 'SLA guarantee', 'On-prem option'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

function getRiskColor(risk: string) {
  switch (risk) {
    case 'critical': return 'text-red-400 bg-red-500/10'
    case 'high': return 'text-orange-400 bg-orange-500/10'
    case 'medium': return 'text-amber-400 bg-amber-500/10'
    default: return 'text-emerald-400 bg-emerald-500/10'
  }
}

function getScoreColor(score: number) {
  if (score < 30) return 'text-red-400'
  if (score < 50) return 'text-orange-400'
  if (score < 70) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-400" />
            <span className="text-xl font-bold">ChurnGuard</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">Docs</Link>
            <Link href="/presentation" className="text-sm text-white/60 hover:text-white transition-colors">Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-sm text-red-300 mb-8">
              <AlertTriangle className="w-4 h-4" />
              Your customers are sending churn signals right now
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Predict churn{' '}
              <span className="text-blue-400">before</span>
              <br />
              it costs you
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              ChurnGuard tracks customer health in real-time on Aurora DSQL — globally distributed SQL
              that keeps scores consistent whether your customers are in Tokyo or New York. Catch the
              signals. Act before they cancel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 text-lg shadow-lg shadow-blue-900/30"
              >
                Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/demo"
                className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/80 hover:text-white px-8 py-4 rounded-xl transition-all"
              >
                View Live Demo
              </Link>
            </div>

            {/* Risk stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {RISK_STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-4 text-left"
                >
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Dashboard Preview */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-blue-950/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Your customer health, live</h2>
            <p className="text-white/50">Every event updates health scores in real-time via Aurora DSQL</p>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-white/30 text-xs ml-2">churnguard.app/dashboard</span>
              <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live · 42 events/min
              </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/5">
              {[
                { label: 'Total MRR', value: '$47,280', icon: DollarSign, color: 'text-blue-400' },
                { label: 'MRR At Risk', value: '$9,100', icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Critical Risk', value: '3', icon: TrendingDown, color: 'text-red-400' },
                { label: 'Avg Health', value: '61/100', icon: Users, color: 'text-emerald-400' },
              ].map((card) => (
                <div key={card.label} className="bg-white/3 rounded-xl p-4">
                  <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
                  <div className="text-xl font-bold">{card.value}</div>
                  <div className="text-xs text-white/40 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Customer list */}
            <div className="p-6">
              <div className="text-sm font-medium text-white/60 mb-4">Customers at Risk — sorted by severity</div>
              <div className="space-y-2">
                {CUSTOMERS_MOCK.map((customer) => (
                  <div key={customer.name} className="flex items-center gap-4 bg-white/3 hover:bg-white/5 rounded-xl px-4 py-3 transition-colors cursor-pointer">
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for SaaS, powered by distributed SQL</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Aurora DSQL&apos;s active-active global distribution is what makes real-time health scoring
              possible at scale — no compromises on consistency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/3 border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-white/50 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SDK section */}
      <section className="py-16 px-6 bg-white/2">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Integrate in 60 seconds</h2>
          <p className="text-white/50 mb-8">3 lines of code to start tracking customer health</p>
          <div className="bg-[#111] rounded-2xl p-6 text-left font-mono text-sm border border-white/10">
            <div className="text-white/40 mb-2">// npm install @churnguard/sdk</div>
            <div><span className="text-blue-400">import</span> <span className="text-white">{"{ ChurnGuard }"}</span> <span className="text-blue-400">from</span> <span className="text-green-400">'@churnguard/sdk'</span></div>
            <div className="mt-2"><span className="text-blue-400">const</span> <span className="text-white">cg = </span><span className="text-blue-400">new</span> <span className="text-yellow-400">ChurnGuard</span><span className="text-white">({"{ apiKey: process.env.CHURNGUARD_KEY }"})
            </span></div>
            <div className="mt-4 text-white/40">// Track any customer event</div>
            <div><span className="text-blue-400">await</span> <span className="text-white">cg.</span><span className="text-yellow-400">track</span><span className="text-white">({"{ customerId: userId, event: 'feature_used' }"})
            </span></div>
            <div className="mt-2 text-white/40">// Aurora DSQL updates health score globally in milliseconds</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Start protecting revenue today</h2>
            <p className="text-white/50">ROI-positive from day 1. Stop one churn → pays for the plan.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-white/3 border border-white/10'
                }`}
              >
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/50">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signin"
                  className={`w-full text-center py-3 rounded-xl font-semibold transition-all ${
                    plan.highlight ? 'bg-white text-blue-700 hover:bg-white/90' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">ChurnGuard</span>
          </div>
          <p className="text-white/30 text-sm">Built on Aurora DSQL + Vercel · #H0Hackathon</p>
        </div>
      </footer>
    </div>
  )
}
