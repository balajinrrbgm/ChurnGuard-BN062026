# ChurnGuard — Demo Script

**Total demo time**: 2:50 minutes

---

## Pre-Demo Checklist
- [ ] Dashboard at churnguard.app/dashboard
- [ ] Demo tenant pre-loaded with 150 customers and 30 days of event history
- [ ] 3 customers in "critical" risk visible
- [ ] Slack webhook ready to demonstrate playbook execution
- [ ] AWS Console tab showing Aurora DSQL cluster (multi-region)
- [ ] Postman or curl command ready for SDK demo

---

## Demo Flow

### [0:00–0:20] Hook

**Say**: *"SaaS companies are losing 5-7% of their ARR every month to churn — and most don't know which customers are at risk until it's too late. ChurnGuard changes that."*

**Show**: Dashboard with MRR at risk highlighted in red ($9,100 of $47K MRR)

---

### [0:20–1:00] Real-Time Health Dashboard

**Action**: Show the customer list sorted by risk  
**Say**: *"Every customer has a real-time health score from 0 to 100. It's calculated from 15 behavioral signals — logins, feature usage, API calls, support tickets — updated every time an event comes in."*

**Highlight**: Acme Corp at score 23 (critical)  
**Say**: *"Acme Corp: 12 days inactive, zero logins, 3 support tickets this week. Score dropped from 71 to 23 in two weeks. Without ChurnGuard, you'd find out they cancelled next billing cycle."*

**Action**: Click on Acme Corp → show health trend chart  
**Say**: *"This 30-day health timeline shows exactly when the drop started — right after their primary admin left the company. Aurora DSQL stores every score in history, globally consistent across all regions."*

---

### [1:00–1:20] Aurora DSQL — Global Distribution

**Action**: Switch to AWS Console → show Aurora DSQL cluster  
**Say**: *"This is our Aurora DSQL cluster. Unlike standard Aurora, DSQL is active-active — it writes to multiple regions simultaneously with strong consistency. If our customer's events come from Tokyo, they write to ap-northeast-1. London writes to eu-west-1. No single-region bottleneck."*

**Show**: Multi-region endpoints in DSQL cluster config  
**Say**: *"Same PostgreSQL query surface — our health score calculation runs as a SQL function directly in DSQL. No separate analytics pipeline needed."*

---

### [1:20–1:45] Playbook Execution

**Action**: Navigate to Playbooks  
**Say**: *"When health drops below 40, ChurnGuard automatically triggers a playbook. Let me show you."*

**Action**: Trigger demo playbook → show Slack notification appearing  
**Say**: *"Lambda receives the trigger, reads the playbook configuration from DSQL, executes the actions — Slack alert to the CS team, email to the account manager, task assigned in the CRM. The whole chain in under 2 seconds."*

---

### [1:45–2:10] SDK Integration

**Action**: Show code snippet  
**Say**: *"Integration is 3 lines. Install the SDK, initialize with your API key, and call `.track()` on any user action. That event flows to Vercel → Aurora DSQL → health score updated globally in milliseconds."*

**Action**: Run curl command to send event:
```bash
curl -X POST https://churnguard.app/api/ingest \
  -H "Authorization: Bearer cg_demo_key" \
  -d '{"events":[{"customerId":"acme_123","eventType":"login","eventName":"dashboard_login"}]}'
```

**Show**: Acme Corp's health score tick up slightly in real-time  
**Say**: *"Acme Corp just logged in. Score went from 23 to 26. Small signal, but it's tracked. Aurora DSQL just committed that event consistently across all regions."*

---

### [2:10–2:40] Revenue Impact + Business Model

**Action**: Navigate to Revenue Intelligence tab  
**Say**: *"The bottom line: $9,100 of MRR is at critical or high risk right now. If ChurnGuard helps retain just 2 of those accounts, that's $5,000 MRR saved — which at $199/month for our Growth plan means 25x ROI."*

**Show**: Pricing slide  
**Say**: *"Starter at $49, Growth at $199, Enterprise custom. Stop one churn per month → the product pays for itself."*

---

### [2:40–2:50] Close

**Say**: *"ChurnGuard is built to ship. Aurora DSQL handles the globally distributed SQL so we don't have to. Vercel puts the dashboard at the edge globally. This is production software — not a demo."*

---

## Backup Plans

| Failure | Recovery |
|---|---|
| DSQL connection timeout | Show pre-recorded dashboard video; describe architecture verbally |
| Slack webhook fails | Show screenshot of expected Slack notification |
| Score doesn't update live | Pre-set a customer with a score you can manually change |
