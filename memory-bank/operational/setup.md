# Setup Guide

## Prerequisites

- Node.js 20+
- AWS Account with administrative access
- Supabase account
- Slack workspace (for alerts)
- GitHub account (for CI/CD)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/iamarsh/config-drift-detector.git
cd config-drift-detector
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both backend and frontend workspaces.

### 3. Backend Setup

#### Create `.env.local`

```bash
cd backend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
AWS_ACCOUNT_ID=218885889357
AWS_REGION=us-east-2
S3_BUCKET_NAME=config-drift-snapshots-218885889357

SUPABASE_URL=https://yhwlsztdlxixrdycpedg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

NODE_ENV=development
LOG_LEVEL=info
```

#### Build Backend

```bash
npm run build
```

#### Run Tests

```bash
npm test
```

### 4. Frontend Setup

#### Create `.env.local`

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yhwlsztdlxixrdycpedg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## AWS Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://config-drift-snapshots-218885889357 --region us-east-2
```

### 2. Create IAM Role for Lambda

The role `lambda-config-drift-detector-role` should have:

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Permissions**:
- `AWSLambdaBasicExecutionRole` (managed policy)
- Custom inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::config-drift-snapshots-218885889357",
        "arn:aws:s3:::config-drift-snapshots-218885889357/*"
      ]
    }
  ]
}
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note the `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 2. Create Tables

Run this SQL in the Supabase SQL Editor:

```sql
-- drift_events table
CREATE TABLE IF NOT EXISTS drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  change_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  previous_state JSONB,
  current_state JSONB
);

-- baselines table
CREATE TABLE IF NOT EXISTS baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drift_events_account_id ON drift_events(account_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON drift_events(severity);
CREATE INDEX IF NOT EXISTS idx_drift_events_acknowledged ON drift_events(acknowledged);
CREATE INDEX IF NOT EXISTS idx_baselines_account_id ON baselines(account_id);
```

## Slack Setup

### 1. Create Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: `Config Drift Detector`
4. Select your workspace

### 2. Enable Incoming Webhooks

1. Navigate to "Incoming Webhooks" in the left sidebar
2. Toggle "Activate Incoming Webhooks" to On
3. Click "Add New Webhook to Workspace"
4. Select a channel for alerts
5. Copy the Webhook URL

### 3. Update Environment Variables

Add the webhook URL to `backend/.env.local`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Testing Locally

### Test Snapshot Lambda

```bash
cd backend
node dist/lambdas/snapshot.js
```

Check S3 for new snapshot file.

### Test Detect Lambda

```bash
node dist/lambdas/detect.js
```

Check Supabase `drift_events` table for new rows.

### Test Alert Lambda

```bash
node dist/lambdas/alert.js
```

Check Slack channel for alert message.

## Troubleshooting

### AWS Permissions Issues

If snapshot Lambda fails with "Access Denied":
- Verify IAM role has EC2 Describe permissions
- Check S3 bucket policy allows Lambda role

### Supabase Connection Issues

If detect Lambda fails with "Connection refused":
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is not paused

### Slack Webhook Issues

If alert Lambda fails to send Slack message:
- Verify `SLACK_WEBHOOK_URL` is correct
- Test webhook with `curl`:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL
```

## Next Steps

After local setup is complete:
1. Deploy backend to AWS (see [deployment.md](deployment.md))
2. Deploy frontend to Vercel (see [deployment.md](deployment.md))
3. Configure GitHub Actions (see [deployment.md](deployment.md))
