# Architecture Decision Records

## ADR-001: Use Supabase over DynamoDB

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Need a database to store drift events and baselines. Options: DynamoDB, RDS PostgreSQL, Supabase.

**Decision**:
Use Supabase (managed PostgreSQL).

**Rationale**:
- Better querying capabilities than DynamoDB
- Real-time subscriptions for future dashboard updates
- Simpler schema management
- Built-in authentication and Row Level Security
- Free tier sufficient for MVP
- Faster development with auto-generated REST API

**Consequences**:
- External dependency (not fully AWS-native)
- Requires API key management
- Network latency to Supabase (vs. same-region DynamoDB)

---

## ADR-002: Use Serverless Framework over AWS CDK

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Need IaC tool for Lambda deployment. Options: CDK, SAM, Serverless Framework, Terraform.

**Decision**:
Use Serverless Framework v3.

**Rationale**:
- Faster iteration for Lambda-centric applications
- Simpler syntax than CDK
- Built-in EventBridge integration
- Good plugin ecosystem (serverless-esbuild)
- Widely adopted in community

**Consequences**:
- Less control than CDK for complex infrastructure
- Plugin dependency (serverless-esbuild)
- v4 requires authentication (using v3 for now)

---

## ADR-003: Use Pino over Winston for Logging

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Need structured logging for Lambda functions.

**Decision**:
Use Pino.

**Rationale**:
- Faster than Winston (JSON serialization)
- Lightweight (important for Lambda cold starts)
- Good TypeScript support
- Pretty-printing for local development

**Consequences**:
- Less feature-rich than Winston
- Fewer transport options

---

## ADR-004: Use Next.js App Router over Pages Router

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Choose Next.js routing pattern for dashboard.

**Decision**:
Use App Router (modern approach).

**Rationale**:
- Future-proof architecture
- Server components support (future optimization)
- Better data fetching patterns
- Recommended by Next.js team

**Consequences**:
- Steeper learning curve
- Fewer community examples than Pages Router
- Required `'use client'` directive for all interactive components

---

## ADR-005: Polling (5s) over Real-time Subscriptions (v1)

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Dashboard data refresh strategy.

**Decision**:
Use 5-second polling for v1.

**Rationale**:
- Simpler implementation
- No WebSocket connection management
- Sufficient for MVP (drift detection is already 30min delayed)
- Can upgrade to Supabase real-time subscriptions in v1.1

**Consequences**:
- Higher network traffic
- Not truly "real-time"
- More Supabase API calls

---

## ADR-006: JSON.stringify Diff over Structured Diff Library

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
How to detect configuration changes between snapshots.

**Decision**:
Use simple JSON.stringify comparison for v1.

**Rationale**:
- Simple to implement
- Works for all resource types
- Good enough for detecting *that* drift occurred
- Can add structured diff library (deep-diff, jsondiffpatch) in v1.1 for better UX

**Consequences**:
- Cannot show field-level changes in dashboard
- May have false positives due to field ordering
- Dashboard shows full before/after JSON blobs

---

## ADR-007: EventBridge Cron over CloudWatch Events

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Trigger mechanism for periodic Lambda execution.

**Decision**:
Use EventBridge Scheduler with cron expressions.

**Rationale**:
- EventBridge is the modern successor to CloudWatch Events
- Better integration with Serverless Framework
- More flexible scheduling options
- Same pricing as CloudWatch Events

**Consequences**:
- None (fully compatible replacement)

---

## ADR-008: GitHub Actions over AWS CodePipeline

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
CI/CD platform for automated deployment.

**Decision**:
Use GitHub Actions.

**Rationale**:
- Code already on GitHub
- Free for public repos, generous free tier for private
- Easier secrets management
- Better integration with Vercel
- Simpler workflow syntax than CodePipeline

**Consequences**:
- Requires GitHub Secrets configuration
- Less AWS-native than CodePipeline
- Dependent on GitHub availability

---

## ADR-009: Vercel over AWS Amplify for Frontend Hosting

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Hosting platform for Next.js dashboard.

**Decision**:
Use Vercel.

**Rationale**:
- Built by Next.js creators (best support)
- Automatic preview deployments
- Global CDN out of the box
- Simpler than Amplify for Next.js
- Generous free tier

**Consequences**:
- External dependency (not AWS-native)
- Requires Vercel account and token management
- Vendor lock-in for frontend hosting

---

## ADR-010: Monorepo over Separate Repositories

**Date**: 2026-01-18

**Status**: Accepted

**Context**:
Project structure for backend and frontend.

**Decision**:
Use monorepo with npm workspaces.

**Rationale**:
- Shared types between frontend and backend (future enhancement)
- Atomic commits for full-stack features
- Single CI/CD configuration
- Easier dependency management

**Consequences**:
- Larger repository
- Requires workspace-aware CI/CD
- Must carefully manage workspace dependencies
