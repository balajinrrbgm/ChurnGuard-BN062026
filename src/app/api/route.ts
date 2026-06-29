import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      message: 'ChurnGuard API',
      version: '1.0.0',
      endpoints: {
        auth: {
          url: '/api/auth/signin',
          method: 'GET/POST',
          description: 'NextAuth.js authentication endpoints'
        },
        ingest: {
          url: '/api/ingest',
          method: 'POST',
          description: 'Ingest customer events',
          auth: 'Bearer token (X-API-Key header)',
          payload: {
            customer_id: 'UUID',
            event_type: 'string',
            event_name: 'string',
            properties: 'object'
          }
        },
        insights: {
          url: '/api/insights',
          method: 'POST',
          description: 'Get AI-powered churn insights',
          auth: 'Bearer token',
          payload: {
            customer_id: 'UUID'
          }
        },
        demo: {
          url: '/api/demo',
          method: 'GET',
          description: 'Get live demo data (real customer data from Aurora DSQL)',
          response: {
            customers: 'array',
            summary: 'object with totalMRR, mrrAtRisk, criticalCount, avgHealth'
          }
        }
      },
      documentation: '/docs',
      status: 'operational'
    },
    { status: 200 }
  )
}
