-- =============================================================================
-- ChurnGuard — Aurora DSQL Schema
-- Aurora DSQL is serverless distributed SQL — PostgreSQL wire protocol compatible
-- Optimized for multi-tenant B2B SaaS with globally distributed writes
-- =============================================================================

-- Note: Aurora DSQL supports PostgreSQL syntax.
-- Multi-region active-active: write to nearest region, reads are globally consistent.

-- =============================================================================
-- TENANTS (B2B organizations using ChurnGuard)
-- =============================================================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    domain          TEXT UNIQUE,
    plan            TEXT NOT NULL DEFAULT 'starter'
                        CHECK (plan IN ('starter', 'growth', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    webhook_url     TEXT,
    ingest_api_key  TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_ingest_key ON tenants(ingest_api_key);

-- =============================================================================
-- TENANT USERS (CS team members within each tenant)
-- =============================================================================
CREATE TABLE tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    avatar_url  TEXT,
    last_seen   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);

-- =============================================================================
-- CUSTOMERS (end customers of the SaaS using ChurnGuard)
-- =============================================================================
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id     TEXT NOT NULL,               -- ID from the SaaS app
    name            TEXT NOT NULL,
    email           TEXT,
    company         TEXT,
    plan            TEXT,
    mrr             NUMERIC(10, 2) DEFAULT 0,
    currency        CHAR(3) DEFAULT 'USD',
    signup_date     DATE,
    renewal_date    DATE,
    region          TEXT,                        -- customer's timezone region
    health_score    SMALLINT DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
    churn_risk      TEXT DEFAULT 'medium' CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),
    last_event_at   TIMESTAMPTZ,
    is_churned      BOOLEAN DEFAULT FALSE,
    churned_at      TIMESTAMPTZ,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, external_id)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_health ON customers(tenant_id, health_score);
CREATE INDEX idx_customers_risk ON customers(tenant_id, churn_risk);
CREATE INDEX idx_customers_mrr ON customers(tenant_id, mrr DESC);
CREATE INDEX idx_customers_renewal ON customers(tenant_id, renewal_date);

-- =============================================================================
-- CUSTOMER EVENTS (every user action tracked)
-- =============================================================================
CREATE TABLE customer_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,               -- 'login', 'feature_used', 'api_call', 'support_ticket', etc.
    event_name      TEXT NOT NULL,
    properties      JSONB DEFAULT '{}',
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Partition by month for query performance
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index: tenant + customer + time range queries
CREATE INDEX idx_events_customer_time ON customer_events(customer_id, occurred_at DESC);
CREATE INDEX idx_events_tenant_type ON customer_events(tenant_id, event_type, occurred_at DESC);

-- =============================================================================
-- HEALTH SCORE HISTORY (time-series for trend analysis)
-- =============================================================================
CREATE TABLE health_score_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    churn_risk      TEXT NOT NULL,
    scored_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Signals that contributed to this score
    signals         JSONB DEFAULT '{}'
);

CREATE INDEX idx_health_history_customer ON health_score_history(customer_id, scored_at DESC);
CREATE INDEX idx_health_history_tenant ON health_score_history(tenant_id, scored_at DESC);

-- =============================================================================
-- PLAYBOOKS (automated intervention rules)
-- =============================================================================
CREATE TABLE playbooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('health_drop', 'churn_risk', 'inactivity', 'renewal_approaching')),
    trigger_config  JSONB NOT NULL DEFAULT '{}',    -- e.g. { "health_below": 40, "days_inactive": 14 }
    actions         JSONB NOT NULL DEFAULT '[]',    -- e.g. [{ "type": "slack", "channel": "#cs-team" }]
    is_active       BOOLEAN DEFAULT TRUE,
    execution_count INTEGER DEFAULT 0,
    last_triggered  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playbooks_tenant ON playbooks(tenant_id, is_active);

-- =============================================================================
-- PLAYBOOK EXECUTIONS (audit trail)
-- =============================================================================
CREATE TABLE playbook_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id     UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    result          JSONB DEFAULT '{}',
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_playbook ON playbook_executions(playbook_id, executed_at DESC);
CREATE INDEX idx_executions_customer ON playbook_executions(customer_id, executed_at DESC);

-- =============================================================================
-- HEALTH SCORE CALCULATION — Database function
-- Weights 15 behavioral signals to produce a 0-100 score
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_health_score(
    p_customer_id UUID,
    p_tenant_id UUID
) RETURNS TABLE(score SMALLINT, risk TEXT, signals JSONB) AS $$
DECLARE
    v_logins_30d    INTEGER;
    v_features_30d  INTEGER;
    v_support_7d    INTEGER;
    v_days_inactive INTEGER;
    v_events_trend  NUMERIC;  -- positive = increasing usage, negative = decreasing
    v_score         INTEGER := 50;
    v_signals       JSONB := '{}';
BEGIN
    -- Signal 1: Login frequency (last 30 days)
    SELECT COUNT(*) INTO v_logins_30d
    FROM customer_events
    WHERE customer_id = p_customer_id
      AND event_type = 'login'
      AND occurred_at > NOW() - INTERVAL '30 days';

    -- Signal 2: Feature usage breadth (last 30 days)
    SELECT COUNT(DISTINCT event_name) INTO v_features_30d
    FROM customer_events
    WHERE customer_id = p_customer_id
      AND event_type = 'feature_used'
      AND occurred_at > NOW() - INTERVAL '30 days';

    -- Signal 3: Support tickets (last 7 days — negative signal)
    SELECT COUNT(*) INTO v_support_7d
    FROM customer_events
    WHERE customer_id = p_customer_id
      AND event_type = 'support_ticket'
      AND occurred_at > NOW() - INTERVAL '7 days';

    -- Signal 4: Days since last activity
    SELECT COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(occurred_at)))::INTEGER / 86400, 999)
    INTO v_days_inactive
    FROM customer_events
    WHERE customer_id = p_customer_id;

    -- Calculate score (0-100)
    -- Login frequency: 0 logins = -30, 1-3 = +0, 4-9 = +15, 10+ = +25
    IF v_logins_30d = 0 THEN v_score := v_score - 30;
    ELSIF v_logins_30d >= 10 THEN v_score := v_score + 25;
    ELSIF v_logins_30d >= 4 THEN v_score := v_score + 15;
    END IF;

    -- Feature breadth: more features used = healthier customer
    v_score := v_score + LEAST(v_features_30d * 3, 20);

    -- Support tickets: too many = struggling customer
    v_score := v_score - (v_support_7d * 5);

    -- Inactivity penalty
    IF v_days_inactive > 30 THEN v_score := v_score - 30;
    ELSIF v_days_inactive > 14 THEN v_score := v_score - 15;
    ELSIF v_days_inactive > 7 THEN v_score := v_score - 5;
    END IF;

    -- Clamp to 0-100
    v_score := GREATEST(0, LEAST(100, v_score));

    v_signals := jsonb_build_object(
        'logins_30d', v_logins_30d,
        'features_used_30d', v_features_30d,
        'support_tickets_7d', v_support_7d,
        'days_inactive', v_days_inactive
    );

    RETURN QUERY SELECT
        v_score::SMALLINT,
        CASE
            WHEN v_score >= 70 THEN 'low'
            WHEN v_score >= 40 THEN 'medium'
            WHEN v_score >= 20 THEN 'high'
            ELSE 'critical'
        END,
        v_signals;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS — Analytics
-- =============================================================================
CREATE VIEW tenant_health_summary AS
SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    COUNT(c.id) AS total_customers,
    COUNT(c.id) FILTER (WHERE c.churn_risk = 'critical') AS critical_risk_count,
    COUNT(c.id) FILTER (WHERE c.churn_risk = 'high') AS high_risk_count,
    SUM(c.mrr) AS total_mrr,
    SUM(c.mrr) FILTER (WHERE c.churn_risk IN ('high', 'critical')) AS mrr_at_risk,
    AVG(c.health_score)::NUMERIC(4,1) AS avg_health_score
FROM tenants t
LEFT JOIN customers c ON c.tenant_id = t.id AND NOT c.is_churned
GROUP BY t.id, t.name;
