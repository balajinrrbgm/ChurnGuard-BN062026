/**
 * POST /api/ingest
 * ChurnGuard event ingestion API — receives customer events from SaaS apps.
 *
 * This is the core data pipeline endpoint that:
 * 1. Authenticates via tenant API key (from Authorization header)
 * 2. Validates event payload
 * 3. Writes events to Aurora DSQL (globally distributed SQL)
 * 4. Optionally triggers health score recalculation
 *
 * SDK Usage (JavaScript):
 *   churnguard.track({ customerId: 'usr_123', event: 'login' })
 */

import { NextRequest } from 'next/server'
import { getTenantByApiKey, ingestEvents, refreshCustomerHealthScore } from '@/lib/db'
import { z } from 'zod'

// Rate limit: max 1000 events per request
const MAX_EVENTS_PER_REQUEST = 1000

const EventSchema = z.object({
  customerId: z.string().min(1),
  eventType: z.enum(['login', 'feature_used', 'api_call', 'support_ticket', 'page_view', 'export', 'share', 'payment', 'custom']),
  eventName: z.string().min(1).max(200),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
})

const IngestPayloadSchema = z.object({
  events: z.array(EventSchema).min(1).max(MAX_EVENTS_PER_REQUEST),
  recalculateHealth: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  // ── Extract API key from Authorization header ──
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
  }
  const apiKey = authHeader.slice(7)

  // ── Look up tenant by API key (constant-time lookup via indexed column) ──
  const tenant = await getTenantByApiKey(apiKey)
  if (!tenant) {
    // Don't reveal whether key exists — always return same error
    return Response.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // ── Parse request body ──
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = IngestPayloadSchema.safeParse(body)
  if (!parseResult.success) {
    return Response.json({ error: 'Invalid payload', details: parseResult.error.issues }, { status: 400 })
  }

  const { events, recalculateHealth } = parseResult.data

  // ── Ingest events to Aurora DSQL ──
  const { ingested, errors } = await ingestEvents(
    tenant.id,
    events.map((e) => ({
      externalCustomerId: e.customerId,
      eventType: e.eventType,
      eventName: e.eventName,
      properties: e.properties,
      occurredAt: e.timestamp,
    }))
  )

  // ── Optionally recalculate health scores ──
  const healthUpdates: { customerId: string; score: number; risk: string }[] = []
  if (recalculateHealth && ingested > 0) {
    // Get unique customer IDs from the batch
    const uniqueCustomerIds = [...new Set(events.map((e) => e.customerId))]
    for (const externalId of uniqueCustomerIds.slice(0, 20)) { // limit to 20 per request
      try {
        // Re-query to get internal UUID for this external ID
        const { db } = await import('@/lib/db')
        const [customer] = await db<{ id: string }[]>`
          SELECT id FROM customers
          WHERE tenant_id = ${tenant.id} AND external_id = ${externalId}
        `
        if (customer) {
          const health = await refreshCustomerHealthScore(customer.id, tenant.id)
          healthUpdates.push({ customerId: externalId, score: health.score, risk: health.risk })
        }
      } catch {
        // Non-critical — health recalc errors don't fail the ingest
      }
    }
  }

  return Response.json({
    ingested,
    errors: errors.length > 0 ? errors : undefined,
    healthUpdates: healthUpdates.length > 0 ? healthUpdates : undefined,
  })
}
