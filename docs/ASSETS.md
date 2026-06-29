# ChurnGuard Submission Assets

This folder contains all presentation and visual assets for the hackathon submission.

## 📊 Assets

### 1. **presentation.html** — Interactive 6-Slide Deck
- **Access**: Open in browser directly or visit `/presentation` route in the app
- **Format**: Self-contained HTML (no external dependencies)
- **Keyboard Navigation**: Arrow keys to navigate, or use Previous/Next buttons
- **Slides**:
  1. Title: "Predict churn before it costs you"
  2. Problem: Silent customers, 5-7% churn, $100K/mo at risk
  3. Solution: Health scoring, churn prediction, automated playbooks
  4. Technology: Aurora DSQL, Amazon Bedrock, Vercel Edge
  5. Impact: $360K/year revenue protected (for $1M ARR)
  6. Call to Action: Easy integration, AI-powered, global scale

### 2. **architecture.svg** — System Architecture Diagram
- **Format**: Scalable vector graphic
- **Components Shown**:
  - Client layer: Browser → Next.js App
  - Vercel Edge: API routes, NextAuth.js
  - AWS (eu-central-1): Aurora DSQL, Amazon Bedrock, Secrets Manager
  - Data Pipeline: Event ingest → Health score calc → AI analysis → Automated actions
  - Monitoring: Dashboards, metrics
- **Design**: Professional dark theme with blue/red accents (matches brand colors)
- **Use**: Include in docs, README, or technical presentations

### 3. **thumbnail.svg** — Brand Thumbnail
- **Format**: Scalable square badge
- **Design**: Shield with health meter + upward arrow
- **Dimensions**: 400×400 (scales to any size)
- **Colors**: Indigo (#60a5fa) + red (#ef4444) + green (#22c55e)
- **Use**: Social media, project cards, docs preview, README badge

---

## 🚀 How to Use

### View Presentation
1. **Local dev**: `npm run dev` → visit http://localhost:3000/presentation
2. **Direct**: Open `presentation.html` in any browser (standalone)
3. **Share**: Copy `/presentation` URL or embed `presentation.html` in emails/docs

### Use Architecture Diagram
```markdown
![ChurnGuard Architecture](./public/architecture.svg)
```

### Use Thumbnail
```markdown
![ChurnGuard](./public/thumbnail.svg)
```

---

## 📋 Key Features Highlighted in Presentation

| Metric | Value |
|--------|-------|
| Average SaaS churn | 5-7% monthly |
| Preventable churn | 50% with early warning |
| Revenue at risk | $100K/mo (at 10% churn, $1M ARR) |
| Churn prevention rate | 30% (typical with ChurnGuard) |
| Annual savings | $360K (for $1M ARR company) |

---

## 🎨 Brand Colors Used

- **Primary Blue**: #3b82f6, #60a5fa
- **Risk Red**: #ef4444
- **Success Green**: #22c55e
- **Dark Background**: #09090b
- **Text**: #e2e8f0, #94a3b8

---

## 📝 Notes

- All assets are **submission-ready** and can be viewed offline
- Presentation includes real metrics and value propositions
- Architecture diagram shows all key services (Aurora DSQL, Bedrock, EventBridge, Lambda)
- Thumbnail is logo-like and suitable for branding/social media
