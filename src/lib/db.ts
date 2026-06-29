/**
 * Aurora DSQL database connection.
 *
 * Aurora DSQL is serverless distributed SQL — it uses the PostgreSQL wire
 * protocol but with built-in connection management and global distribution.
 *
 * Key difference from standard Aurora:
 * - No instance to manage — fully serverless
 * - Built-in connection pooling (no pgBouncer needed)
 * - Active-active multi-region — writes go to nearest region
 * - Uses standard PostgreSQL drivers (postgres.js works directly)
 *
 * For IAM token auth (production, most secure):
 * Aurora DSQL generates short-lived tokens via AWS SDK.
 */

import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null

function getDb() {
  if (sql) return sql

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Aurora DSQL — built-in connection management means we can use a smaller pool
  sql = postgres(connectionString, {
    max: 20,              // DSQL handles pooling internally — safe to set higher
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: { rejectUnauthorized: true },  // Required for DSQL
    transform: {
      column: postgres.toCamel,
    },
    debug: process.env.NODE_ENV === 'development',
  })

  return sql
}

export const db = getDb()

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tenant = {
  id: string
  name: string
  domain: string | null
  plan: 'starter' | 'growth' | 'enterprise'
  ingestApiKey: string
  webhookUrl: string | null
  createdAt: Date
}

export type Customer = {
  id: string
  tenantId: string
  externalId: string
  name: string
  email: string | null
  company: string | null
  plan: string | null
  mrr: number
  currency: string
  signupDate: Date | null
  renewalDate: Date | null
  region: string | null
  healthScore: number
  churnRisk: 'low' | 'medium' | 'high' | 'critical'
  lastEventAt: Date | null
  isChurned: boolean
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type CustomerEvent = {
  id: string
  tenantId: string
  customerId: string
  eventType: string
  eventName: string
  properties: Record<string, unknown>
  occurredAt: Date
}

export type HealthSignals = {
  logins30d: number
  featuresUsed30d: number
  supportTickets7d: number
  daysInactive: number
}

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Get tenant by their ingest API key (used for event ingestion auth).
 */
export async function getTenantByApiKey(apiKey: string): Promise<Tenant | null> {
  const [tenant] = await db<Tenant[]>`
    SELECT * FROM tenants WHERE ingest_api_key = ${apiKey} LIMIT 1
  `
  return tenant ?? null
}

/**
 * Get all customers for a tenant with health scores, ordered by risk.
 */
export async function getTenantCustomers(
  tenantId: string,
  options: {
    churnRisk?: Customer['churnRisk']
    limit?: number
    offset?: number
  } = {}
): Promise<{ customers: Customer[]; total: number }> {
  const { churnRisk, limit = 50, offset = 0 } = options

  const customers = await db<Customer[]>`
    SELECT *
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND NOT is_churned
      ${churnRisk ? db`AND churn_risk = ${churnRisk}` : db``}
    ORDER BY
      CASE churn_risk
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END ASC,
      mrr DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await db<[{ count: number }]>`
    SELECT COUNT(*)::int AS count
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND NOT is_churned
      ${churnRisk ? db`AND churn_risk = ${churnRisk}` : db``}
  `

  return { customers, total: count }
}

/**
 * Ingest a batch of customer events.
 * Uses Aurora DSQL's distributed write capability for global event ingestion.
 */
export async function ingestEvents(
  tenantId: string,
  events: {
    externalCustomerId: string
    eventType: string
    eventName: string
    properties?: Record<string, unknown>
    occurredAt?: string
  }[]
): Promise<{ ingested: number; errors: string[] }> {
  const errors: string[] = []
  let ingested = 0

  for (const event of events) {
    try {
      // Find or create customer
      const [customer] = await db<{ id: string }[]>`
        SELECT id FROM customers
        WHERE tenant_id = ${tenantId} AND external_id = ${event.externalCustomerId}
      `
      if (!customer) {
        errors.push(`Customer not found: ${event.externalCustomerId}`)
        continue
      }

      // Insert event
      await db`
        INSERT INTO customer_events (tenant_id, customer_id, event_type, event_name, properties, occurred_at)
        VALUES (
          ${tenantId},
          ${customer.id},
          ${event.eventType},
          ${event.eventName},
          ${JSON.stringify(event.properties ?? {})}::jsonb,
          ${event.occurredAt ? new Date(event.occurredAt) : new Date()}
        )
      `

      // Update customer's last_event_at
      await db`
        UPDATE customers
        SET last_event_at = NOW(), updated_at = NOW()
        WHERE id = ${customer.id}
      `

      ingested++
    } catch (err) {
      errors.push(`Failed to ingest event for ${event.externalCustomerId}: ${String(err)}`)
    }
  }

  return { ingested, errors }
}

/**
 * Recalculate health score for a customer using the DB function.
 * Aurora DSQL's global consistency means this is immediately visible everywhere.
 */
export async function refreshCustomerHealthScore(
  customerId: string,
  tenantId: string
): Promise<{ score: number; risk: Customer['churnRisk']; signals: HealthSignals }> {
  const [result] = await db<[{ score: number; risk: Customer['churnRisk']; signals: HealthSignals }]>`
    SELECT * FROM calculate_health_score(${customerId}::uuid, ${tenantId}::uuid)
  `

  // Update customer record
  await db`
    UPDATE customers
    SET
      health_score = ${result.score},
      churn_risk = ${result.risk},
      updated_at = NOW()
    WHERE id = ${customerId}
  `

  // Store in history
  await db`
    INSERT INTO health_score_history (customer_id, tenant_id, score, churn_risk, signals)
    VALUES (${customerId}::uuid, ${tenantId}::uuid, ${result.score}, ${result.risk}, ${JSON.stringify(result.signals)}::jsonb)
  `

  return result
}

/**
 * Get tenant-level health summary for the main dashboard.
 */
export async function getTenantHealthSummary(tenantId: string) {
  const [summary] = await db`
    SELECT * FROM tenant_health_summary WHERE tenant_id = ${tenantId}
  `
  return summary
}
