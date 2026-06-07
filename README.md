# VendorSight
### AI-Powered Third-Party Risk Intelligence

> Automating vendor risk assessment from weeks to minutes using Claude AI

## Live Demo
https://tprm-demo-new-srk.vercel.app

## Overview
VendorSight is an AI-native TPRM (Third-Party Risk Management) platform that automates the vendor risk assessment lifecycle — replacing manual, email-driven workflows with intelligent AI scoring, dynamic questionnaires, and executive-grade risk reports.

Built to demonstrate how legacy tools like KY3P can be modernized using generative AI and low-code automation.

## What It Does
- Vendor registers via intake form with demographic profiling
- Claude AI classifies vendor into risk Tier 1, 2, or 3
- Inherent risk calculated using 5×5 likelihood × impact matrix
- AI generates 8 tailored due diligence questions per vendor
- Vendor responses scored 0–100 per question by Claude
- Residual risk calculated after control effectiveness scoring
- Full AI executive risk narrative, key findings & recommendations
- Risk matrix heat map showing inherent vs residual risk position
- Approval workflow with risk owner decision tracking
- Complete risk dashboard with tier, inherent, and residual risk

## The Problem It Solves
Traditional TPRM tools (KY3P, ProcessUnity, RSA Archer) rely on static questionnaire templates, manual scoring, and analyst-written narratives. Each vendor assessment takes 3–4 weeks and 30–40 hours of analyst time.

VendorSight reduces that to under 10 minutes using AI — while applying consistent TPRM methodology including inherent risk, residual risk, and risk matrix positioning.

## Tech Stack
- **Frontend & Backend:** Next.js 14, TypeScript, App Router
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **AI Engine:** Anthropic Claude API (Haiku model)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Target Market
Mid-size organizations (regional banks, insurance firms, healthcare companies) with 50–500 vendors who cannot justify $50K+/year enterprise TPRM tools but have real compliance obligations.

## Built By
**Sagar Kadhiwala**
[LinkedIn](https://www.linkedin.com/in/sagarkadhiwala) | [GitHub](https://github.com/sagarkadhiwala-grctprm/tprm-demo-new)

---
*This is a portfolio/demonstration project. Not intended for production compliance use without additional security review and validation.*
