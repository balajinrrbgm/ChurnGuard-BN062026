'use client'

import Link from 'next/link'
import { BookOpen, Code2, Zap, Shield, ArrowLeft } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xl font-bold">ChurnGuard Docs</span>
          </Link>
          <div className="text-sm text-white/60">Documentation</div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-white/60">Get started with ChurnGuard API and SDK integration</p>
        </div>

        {/* Quick Start */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Quick Start</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p><strong>1. Get API Key</strong><br/>Sign up and generate your API key from the dashboard</p>
              <p><strong>2. Install SDK</strong><br/><code className="bg-black/50 px-2 py-1 rounded text-sm">npm install @churnguard/sdk</code></p>
              <p><strong>3. Track Events</strong><br/>Send customer events via the SDK</p>
              <Link href="/" className="inline-block mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors">Get Started →</Link>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Code2 className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold">API Reference</h2>
            </div>
            <div className="space-y-4 text-white/70">
              <p><strong>Base URL</strong><br/><code className="bg-black/50 px-2 py-1 rounded text-sm">https://churn-guard-bn-062026.vercel.app/api</code></p>
              <p><strong>Authentication</strong><br/>Bearer token in Authorization header</p>
              <p><strong>Rate Limit</strong><br/>1000 requests per minute</p>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold">API Endpoints</h2>
          </div>

          <div className="space-y-6">
            {/* POST /ingest */}
            <div className="border border-white/10 rounded-lg p-6 bg-black/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-blue-300 font-mono">/api/ingest</code>
              </div>
              <p className="text-white/70 mb-4">Track customer events and update health scores in real-time</p>
              <div className="bg-black/50 rounded p-4 text-sm font-mono text-white/60">
                <div className="text-emerald-400">Request body:</div>
                <pre className="mt-2 text-xs overflow-x-auto">
{`{
  "customerId": "uuid",
  "event": "feature_used|login|support_ticket",
  "metadata": {
    "duration": 300,
    "feature": "reports"
  }
}`}
                </pre>
              </div>
            </div>

            {/* POST /insights */}
            <div className="border border-white/10 rounded-lg p-6 bg-black/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-blue-300 font-mono">/api/insights</code>
              </div>
              <p className="text-white/70 mb-4">Get AI-powered churn insights and recommendations</p>
              <div className="bg-black/50 rounded p-4 text-sm font-mono text-white/60">
                <div className="text-emerald-400">Request body:</div>
                <pre className="mt-2 text-xs overflow-x-auto">
{`{
  "customerId": "uuid",
  "timeRange": "30d"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* SDK Guide */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">SDK Integration</h2>
          </div>

          <div className="bg-black/50 rounded-lg p-6 text-sm font-mono text-white/70 overflow-x-auto">
            <pre>{`// Initialize ChurnGuard
import { ChurnGuard } from '@churnguard/sdk'

const cg = new ChurnGuard({
  apiKey: process.env.CHURNGUARD_API_KEY
})

// Track customer event
await cg.track({
  customerId: 'cust_123',
  event: 'feature_used',
  metadata: {
    feature: 'analytics_dashboard',
    duration: 300
  }
})

// Get health score
const health = await cg.getHealthScore('cust_123')
console.log(health.score) // 0-100

// Subscribe to churn alerts
cg.on('churn_risk', (alert) => {
  console.log(\`Customer at risk: \${alert.customerId}\`)
})`}</pre>
          </div>
        </div>

        {/* Examples */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">JavaScript</h3>
            <div className="bg-black/50 rounded p-4 text-xs font-mono text-white/60 overflow-x-auto">
              <pre>{`// Node.js / Browser
const response = await fetch(
  'https://churn-guard-bn-062026.vercel.app/api/ingest',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer YOUR_API_KEY\`
    },
    body: JSON.stringify({
      customerId: 'cust_123',
      event: 'login'
    })
  }
)
const data = await response.json()`}</pre>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Python</h3>
            <div className="bg-black/50 rounded p-4 text-xs font-mono text-white/60 overflow-x-auto">
              <pre>{`import requests

response = requests.post(
    'https://churn-guard-bn-062026.vercel.app/api/ingest',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'customerId': 'cust_123',
        'event': 'login'
    }
)
print(response.json())`}</pre>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Need Help?</h3>
          <p className="text-white/70 mb-4">Check our FAQ or contact support</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="text-blue-400 hover:text-blue-300">FAQ →</Link>
            <Link href="/" className="text-blue-400 hover:text-blue-300">Contact Support →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
