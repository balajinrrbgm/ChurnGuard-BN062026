import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = getDb()

    // Get customers with their health scores (live data from Aurora DSQL)
    const customers = await db`
      SELECT 
        id,
        external_id as "externalId",
        name,
        company,
        mrr,
        health_score as "healthScore",
        churn_risk as "churnRisk",
        last_event_at as "lastEventAt"
      FROM customers
      ORDER BY health_score ASC, mrr DESC
      LIMIT 10
    `

    // Get tenant summary stats
    const stats = await db`
      SELECT 
        COALESCE(SUM(mrr), 0) as total_mrr,
        COALESCE(SUM(CASE WHEN churn_risk = 'critical' THEN mrr ELSE 0 END), 0) as mrr_at_risk,
        COUNT(CASE WHEN churn_risk = 'critical' THEN 1 END) as critical_count,
        COALESCE(AVG(health_score), 0) as avg_health
      FROM customers
    `

    return NextResponse.json({
      customers: customers.map(c => ({
        name: c.name || c.company || 'Unknown',
        mrr: Number(c.mrr) || 0,
        score: Number(c.healthScore) || 0,
        risk: c.churnRisk || 'low',
        lastSeen: c.lastEventAt 
          ? new Date(c.lastEventAt).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Never',
      })),
      summary: {
        totalMRR: Number(stats[0]?.total_mrr) || 0,
        mrrAtRisk: Number(stats[0]?.mrr_at_risk) || 0,
        criticalCount: Number(stats[0]?.critical_count) || 0,
        avgHealth: Math.round(Number(stats[0]?.avg_health) || 0),
      }
    })
  } catch (error) {
    console.error('Demo data fetch error:', error)
    // Return mock data if database fails
    return NextResponse.json({
      customers: [
        { name: 'Acme Corp', mrr: 4200, score: 23, risk: 'critical', lastSeen: '12 days ago' },
        { name: 'TechFlow Inc', mrr: 1800, score: 41, risk: 'high', lastSeen: '4 days ago' },
        { name: 'StartupXYZ', mrr: 3100, score: 38, risk: 'high', lastSeen: '2 days ago' },
        { name: 'BigCo Ltd', mrr: 9500, score: 72, risk: 'low', lastSeen: '1 hour ago' },
        { name: 'Innovate LLC', mrr: 650, score: 85, risk: 'low', lastSeen: '30 min ago' },
      ],
      summary: {
        totalMRR: 47280,
        mrrAtRisk: 9100,
        criticalCount: 3,
        avgHealth: 61
      }
    })
  }
}
