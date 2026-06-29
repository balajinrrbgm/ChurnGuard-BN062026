/**
 * POST /api/insights
 * AI-powered churn analysis using Amazon Bedrock (Claude 3 Haiku).
 *
 * Given a customer's health score and recent events, Bedrock generates:
 * - Plain-English explanation of why the customer is at risk
 * - Top 3 specific recommended actions for the CS team
 * - Predicted probability of churning in 30/60/90 days
 *
 * Uses the Bedrock Converse API — the unified cross-model interface.
 * Model: eu.anthropic.claude-3-haiku-20240307-v1:0 (available in eu-central-1)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from '@aws-sdk/client-bedrock-runtime'
import { z } from 'zod'

// ─── Bedrock client — eu-central-1 ───────────────────────────────────────────
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? 'eu-central-1',
  // Credentials: on Vercel, use AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars.
  // On Lambda/ECS, IAM role is assumed automatically — no explicit creds needed.
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
})

// Cross-region inference profile for eu-central-1
// This routes to the nearest EU region that has the model available.
const MODEL_ID = 'eu.anthropic.claude-3-haiku-20240307-v1:0'

// ─── Request schema ───────────────────────────────────────────────────────────
const InsightsRequestSchema = z.object({
  customerId: z.string().uuid(),
  customerName: z.string(),
  plan: z.string(),
  mrr: z.number(),
  healthScore: z.number().min(0).max(100),
  churnRisk: z.enum(['low', 'medium', 'high', 'critical']),
  daysSinceLastLogin: z.number().optional(),
  openSupportTickets: z.number().optional(),
  recentEvents: z
    .array(
      z.object({
        eventType: z.string(),
        eventName: z.string(),
        count: z.number(),
        lastOccurredAt: z.string().optional(),
      })
    )
    .max(20),
  signals: z
    .object({
      loginFrequencyDrop: z.boolean().optional(),
      featureAdoptionLow: z.boolean().optional(),
      supportTicketSpike: z.boolean().optional(),
      paymentFailed: z.boolean().optional(),
      exportedData: z.boolean().optional(),
    })
    .optional(),
})

type InsightsRequest = z.infer<typeof InsightsRequestSchema>

type InsightsResponse = {
  summary: string           // 2-3 sentence explanation of the risk
  churnProbability: {
    days30: number          // % probability of churning in 30 days
    days60: number
    days90: number
  }
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium'
    action: string          // What the CS team should do
    rationale: string       // Why this action addresses the risk
  }>
  keySignals: string[]      // Bullet points of warning signs
  bedrockModelId: string
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert B2B Customer Success AI analyst specializing in churn prevention.
Given a customer's health data and behavioral signals, produce a structured JSON analysis.

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence plain-English explanation of the churn risk",
  "churnProbability": {
    "days30": <integer 0-100>,
    "days60": <integer 0-100>,
    "days90": <integer 0-100>
  },
  "recommendations": [
    {
      "priority": "urgent|high|medium",
      "action": "specific action for CS team",
      "rationale": "why this addresses the risk"
    }
  ],
  "keySignals": ["signal 1", "signal 2", "signal 3"]
}

Rules:
- churnProbability must increase: days30 <= days60 <= days90
- Provide exactly 3 recommendations, ordered by priority
- keySignals: 3-5 items, specific and actionable
- Keep summary under 150 words
- Be direct and practical — CS teams act on these recommendations`

function buildUserMessage(data: InsightsRequest): string {
  const events = data.recentEvents
    .map((e) => `  - ${e.eventName} (${e.eventType}): ${e.count}x${e.lastOccurredAt ? ` last on ${e.lastOccurredAt}` : ''}`)
    .join('\n')

  const signals = data.signals
    ? Object.entries(data.signals)
        .filter(([, v]) => v === true)
        .map(([k]) => `  - ${k.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        .join('\n') || '  - none detected'
    : '  - not provided'

  return `Customer: ${data.customerName}
Plan: ${data.plan} | MRR: $${data.mrr}/mo
Health Score: ${data.healthScore}/100 | Churn Risk: ${data.churnRisk.toUpperCase()}
Days since last login: ${data.daysSinceLastLogin ?? 'unknown'}
Open support tickets: ${data.openSupportTickets ?? 0}

Recent Events (last 30 days):
${events || '  - no recent events'}

Warning Signals:
${signals}

Analyze this customer and provide churn risk assessment with recommended CS actions.`
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can call Bedrock
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = InsightsRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 })
  }

  const messages: Message[] = [
    {
      role: 'user',
      content: [{ text: buildUserMessage(parsed.data) }],
    },
  ]

  try {
    const response = await bedrockClient.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: SYSTEM_PROMPT }],
        messages,
        inferenceConfig: {
          maxTokens: 1024,
          temperature: 0.2,   // Low temperature — consistent structured output
          topP: 0.9,
        },
      })
    )

    const rawText = response.output?.message?.content?.[0]?.text
    if (!rawText) {
      return Response.json({ error: 'Empty response from Bedrock' }, { status: 502 })
    }

    // Parse the JSON response from Claude
    let insights: Omit<InsightsResponse, 'bedrockModelId'>
    try {
      insights = JSON.parse(rawText)
    } catch {
      // Claude occasionally wraps JSON in markdown fences — strip them
      const stripped = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/, '')
      insights = JSON.parse(stripped)
    }

    return Response.json({
      ...insights,
      bedrockModelId: MODEL_ID,
    } satisfies InsightsResponse)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bedrock invocation failed'
    console.error('Bedrock error:', msg)
    // Surface Bedrock-specific errors clearly
    if (msg.includes('AccessDeniedException')) {
      return Response.json(
        { error: 'Bedrock access denied — check IAM permissions and model access in AWS Console' },
        { status: 403 }
      )
    }
    return Response.json({ error: msg }, { status: 502 })
  }
}
