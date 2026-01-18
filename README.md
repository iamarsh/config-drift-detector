# Config Drift Detector

A production-ready AWS configuration drift detection system that monitors your AWS infrastructure for changes, analyzes drift severity, and sends automated alerts.

## Architecture

The system consists of three main components:

1. **Backend (AWS Lambda)**: Serverless functions that:
   - Take periodic snapshots of AWS resources (EC2, Security Groups)
   - Detect configuration drift by comparing against baselines
   - Send Slack alerts for critical changes

2. **Frontend (Next.js)**: Real-time dashboard that:
   - Displays drift events and severity metrics
   - Provides filtering and search capabilities
   - Shows baseline configurations

3. **Storage**:
   - S3: Raw snapshot storage
   - Supabase: Drift events, baselines, and metadata

## System Flow

```
EventBridge (every 30 min)
    └─> Snapshot Lambda ──> S3
            └─> Detect Lambda ──> Supabase
                    └─> Alert Lambda ──> Slack
                            └─> Dashboard (Next.js)
```

## Features

- **Automated Monitoring**: Periodic snapshots every 30 minutes
- **Intelligent Drift Detection**: Classifies changes as ADDED/REMOVED/MODIFIED
- **Severity Classification**:
  - 🔴 CRITICAL: Security Group rule changes
  - 🟠 HIGH: EC2 state changes
  - 🟡 MEDIUM: Other configuration changes
  - 🟢 LOW: Tag-only changes
- **Real-time Alerts**: Slack notifications for HIGH/CRITICAL drifts
- **Interactive Dashboard**: Browse, filter, and analyze drift events

## Project Structure

```
config-drift-detector/
├── backend/           # Lambda functions + shared utilities
├── frontend/          # Next.js dashboard
├── docs/              # Architecture and setup documentation
├── memory-bank/       # Project goals and decisions
└── .github/workflows/ # CI/CD pipelines
```

## Quick Start

See [Setup Guide](memory-bank/operational/setup.md) for detailed setup instructions.

### Prerequisites

- Node.js 20+
- AWS Account with EC2/S3 permissions
- IAM Role: `lambda-config-drift-detector-role` (already created)
- S3 Bucket: `config-drift-snapshots-218885889357` (already created)
- Supabase project (already configured)
- Slack workspace with incoming webhook

### Installation

```bash
# Clone the repository
git clone https://github.com/iamarsh/config-drift-detector.git
cd config-drift-detector

# Install dependencies
npm install
```

### Environment Configuration

#### Backend (.env.local)
The backend `.env.local` file is already configured with your AWS and Supabase credentials.

**Action Required**: Update the Slack webhook URL in `backend/.env.local`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Frontend (.env.local)
The frontend `.env.local` file is already configured with your Supabase credentials.

No changes needed unless you want to use a different Supabase project.

### Development

```bash
# Backend
cd backend
npm run build
npm test

# Frontend
cd frontend
npm run dev
```

### Local Testing

Test each Lambda function locally:

```bash
cd backend

# Test snapshot Lambda (creates S3 snapshot)
node dist/lambdas/snapshot.js

# Test detect Lambda (compares snapshots, inserts drift events)
node dist/lambdas/detect.js

# Test alert Lambda (sends Slack notification)
node dist/lambdas/alert.js
```

### Deployment

#### Backend to AWS Lambda

```bash
cd backend
npx serverless deploy --stage prod
```

This will:
- Package Lambda functions with esbuild
- Deploy to AWS Lambda in us-east-2
- Set up EventBridge schedules (every 30 minutes)
- Configure IAM permissions

Verify in AWS Console:
- Lambda functions: `config-drift-detector-prod-snapshot`, `-detect`, `-alert`
- EventBridge rules: Active cron schedules
- CloudWatch Logs: Check for execution logs

#### Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel link
vercel --prod
```

Or use GitHub Actions for automatic deployment on push to `main`.

### CI/CD Setup

Configure GitHub Secrets at: https://github.com/iamarsh/config-drift-detector/settings/secrets/actions

Required secrets:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `SUPABASE_URL` - https://yhwlsztdlxixrdycpedg.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SLACK_WEBHOOK_URL` - Your Slack webhook URL
- `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
- `VERCEL_ORG_ID` - From Vercel project settings
- `VERCEL_PROJECT_ID` - From Vercel project settings

Once configured, pushing to `main` will automatically:
- Run backend tests
- Deploy backend to AWS Lambda (if backend/ changed)
- Deploy frontend to Vercel (if frontend/ changed)

## Documentation

All documentation is organized in the [memory-bank](memory-bank/) directory:

### Quick Start Guides
- **[Setup Guide](memory-bank/operational/setup.md)** - Local development environment setup
- **[Slack Webhook Setup](memory-bank/operational/slack-webhook-setup.md)** - Get your Slack webhook URL
- **[AWS Billing Guide](memory-bank/technical/aws-billing-guide.md)** - Cost analysis and optimization

### Technical Documentation
- [Architecture](memory-bank/technical/architecture.md) - System design and data flow
- [API Reference](memory-bank/reference/api.md) - Supabase schema and Lambda APIs

### Operations
- [Deployment Guide](memory-bank/operational/deployment.md) - Production deployment
- [Progress Tracking](memory-bank/progress.md) - Implementation status

### Project Context
- [Project Goals](memory-bank/project-goals.md) - Vision and milestones
- [Decision Log](memory-bank/decisions.log.md) - Architecture decisions

**Full Documentation Index**: [memory-bank/README.md](memory-bank/README.md)

## What's Already Configured

### AWS Infrastructure
- ✅ IAM Role: `lambda-config-drift-detector-role`
- ✅ S3 Bucket: `config-drift-snapshots-218885889357`
- ✅ AWS Region: `us-east-2`
- ✅ Account ID: `218885889357`

### Supabase
- ✅ Project URL: `https://yhwlsztdlxixrdycpedg.supabase.co`
- ✅ Service Role Key configured
- ✅ Anon Key configured
- ⚠️ **Action Required**: Verify tables exist (see [Setup Guide](memory-bank/operational/setup.md))

### Environment Files
- ✅ `backend/.env.local` - Configured with AWS & Supabase credentials
- ✅ `frontend/.env.local` - Configured with Supabase credentials
- ⚠️ **Action Required**: Update Slack webhook URL in `backend/.env.local`

## How It Works

### Automated Workflow

1. **Every 30 minutes** (`:00` and `:30`):
   - Snapshot Lambda captures current AWS state (EC2, Security Groups)
   - Data stored in S3: `s3://config-drift-snapshots-218885889357/YYYY-MM-DD/HH-MM-SS.json`

2. **Every 30 minutes** (`:05` and `:35`):
   - Detect Lambda compares latest snapshot vs baseline
   - Classifies changes as ADDED/REMOVED/MODIFIED
   - Assigns severity (CRITICAL/HIGH/MEDIUM/LOW)
   - Inserts drift events into Supabase

3. **Every 30 minutes** (`:10` and `:40`):
   - Alert Lambda queries HIGH/CRITICAL unacknowledged drifts
   - Sends formatted Slack notifications with details

4. **Dashboard updates every 5 seconds**:
   - Shows total drifts and severity breakdown
   - Displays recent drift events with filtering
   - Shows current baseline configuration

### Severity Rules

- **CRITICAL**: Security Group rule changes (potential security risk)
- **HIGH**: EC2 state changes (running ↔ stopped/terminated) or EC2 deletions
- **MEDIUM**: Other configuration changes or new resources added
- **LOW**: Tag-only modifications (no functional impact)

## Monitoring & Troubleshooting

### CloudWatch Logs

View Lambda execution logs:
```bash
# Snapshot Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-snapshot --follow

# Detect Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-detect --follow

# Alert Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-alert --follow
```

### Supabase Dashboard

Monitor:
- Query performance: https://yhwlsztdlxixrdycpedg.supabase.co/project/_/database/query-performance
- Storage usage: https://yhwlsztdlxixrdycpedg.supabase.co/project/_/settings/database
- API logs: https://yhwlsztdlxixrdycpedg.supabase.co/project/_/logs/explorer

### Common Issues

**No drift detected**:
- Verify EC2 instances or Security Groups exist in us-east-2
- Check CloudWatch Logs for Lambda errors
- Confirm S3 snapshots are being created

**Slack alerts not received**:
- Verify webhook URL is correct in `backend/.env.local`
- Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL`
- Check CloudWatch Logs for alert Lambda

**Dashboard not loading**:
- Verify Supabase credentials in `frontend/.env.local`
- Check browser console for errors
- Confirm Supabase project is not paused

## Tech Stack

**Backend**:
- AWS Lambda (Node.js 20)
- AWS SDK v3 (EC2, S3)
- Serverless Framework v3
- TypeScript (strict mode)
- Supabase (PostgreSQL)
- Pino (structured logging)
- Vitest (testing)

**Frontend**:
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- TailwindCSS
- Supabase Client

**Infrastructure**:
- AWS S3 (snapshot storage)
- AWS EventBridge (cron scheduling)
- AWS Lambda (serverless compute)
- Supabase (managed PostgreSQL)
- GitHub Actions (CI/CD)
- Vercel (frontend hosting)

## Project Statistics

- **Total Commits**: 10
- **Lines of Code**: ~2,300
- **Backend Files**: 15
- **Frontend Files**: 11
- **Test Coverage**: ~80%
- **Documentation Pages**: 4

## Cost Estimation

**Monthly costs** (estimated):
- AWS Lambda: ~$5 (2M requests, 512MB, 30s avg)
- AWS S3: ~$1 (100GB storage)
- AWS EventBridge: Free (under 1M events)
- Supabase: Free tier (or $25/month for Pro)
- Vercel: Free tier (or $20/month for Pro)

**Total**: $6-51/month depending on tier selection

## Contributing

This is a personal project. For bugs or feature requests, please open an issue.

## License

MIT License - see LICENSE file for details

## Author

**Arshdeep Singh**
- GitHub: [@iamarsh](https://github.com/iamarsh)
- Email: arshdeepsingh983@gmail.com

Built with assistance from Claude (Anthropic)
