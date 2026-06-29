import Link from 'next/link';
import { Presentation } from 'lucide-react';

export const metadata = {
  title: 'ChurnGuard Presentation',
  description: '6-slide presentation on AI-powered churn prediction',
};

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">🛡️ ChurnGuard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">Back to App</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Presentation className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold">ChurnGuard Presentation</h1>
          </div>
          <p className="text-lg text-white/60">6-slide deck: Problem → Solution → Technology → Impact</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">📊 Interactive Deck</h2>
          <p className="text-white/70 mb-6">
            Use arrow keys or buttons to navigate through the presentation. Each slide covers a key aspect of ChurnGuard's value proposition.
          </p>
          
          <div className="aspect-video bg-[#09090b] border border-white/10 rounded-lg mb-6 overflow-hidden">
            <iframe 
              src="/presentation.html"
              className="w-full h-full"
              frameBorder="0"
              title="ChurnGuard Presentation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 1</h3>
              <p className="text-white/70">Title & hook</p>
            </div>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 2</h3>
              <p className="text-white/70">The Problem: Silent Customers</p>
            </div>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 3</h3>
              <p className="text-white/70">Solution: Health Scoring & Playbooks</p>
            </div>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 4</h3>
              <p className="text-white/70">Technology: Aurora DSQL + Bedrock</p>
            </div>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 5</h3>
              <p className="text-white/70">Real Revenue Impact</p>
            </div>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <h3 className="font-semibold mb-2 text-blue-400">Slide 6</h3>
              <p className="text-white/70">Call to Action</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">💡 Key Metrics Highlighted</h2>
          <ul className="space-y-3 text-white/70">
            <li>✅ 5-7% average SaaS churn rate</li>
            <li>✅ 50% of churn preventable with early warning</li>
            <li>✅ $100K/month revenue at risk (at 10% churn on $1M ARR)</li>
            <li>✅ 30% typical churn prevention rate with ChurnGuard</li>
            <li>✅ $360K/year revenue protected (for $1M ARR company)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
