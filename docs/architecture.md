# Architecture

## System Overview

Config Drift Detector is a serverless application that monitors AWS infrastructure for configuration changes and alerts on significant drift.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Account (218885889357)              │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │ EventBridge  │───>│ Lambda       │───>│ S3 Bucket    │    │
│  │ (cron 30min) │    │ snapshot.ts  │    │ (snapshots)  │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│                             │                     │            │
│                             v                     v            │
│                      ┌──────────────┐    ┌──────────────┐    │
│                      │ Lambda       │<───│ EventBridge  │    │
│                      │ detect.ts    │    │ (cron +5min) │    │
│                      └──────────────┘    └──────────────┘    │
│                             │                                  │
│                             v                                  │
│                      ┌──────────────┐    ┌──────────────┐    │
│                      │ Lambda       │<───│ EventBridge  │    │
│                      │ alert.ts     │    │ (cron +10min)│    │
│                      └──────────────┘    └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │                    │
                              v                    v
                      ┌──────────────┐    ┌──────────────┐
                      │ Supabase     │    │ Slack        │
                      │ (drift_events│    │ (webhook)    │
                      │  baselines)  │    └──────────────┘
                      └──────────────┘
                              ^
                              │
                      ┌──────────────┐
                      │ Next.js      │
                      │ Dashboard    │
                      │ (Vercel)     │
                      └──────────────┘
```

## Components

### Backend (AWS Lambda)

#### 1. Snapshot Lambda
- **Trigger**: EventBridge cron (every 30 minutes)
- **Function**: Captures current state of AWS resources
- **Resources Monitored**: EC2 instances, Security Groups
- **Output**: JSON snapshot stored in S3

#### 2. Detect Lambda
- **Trigger**: EventBridge cron (5 minutes after snapshot)
- **Function**: Compares latest snapshot against baseline
- **Logic**:
  - Detects ADDED, REMOVED, MODIFIED resources
  - Calculates severity based on change type
  - If no baseline exists, creates one
- **Output**: Drift events inserted into Supabase

#### 3. Alert Lambda
- **Trigger**: EventBridge cron (10 minutes after snapshot)
- **Function**: Sends Slack notifications for critical drifts
- **Filter**: Only HIGH/CRITICAL severity, unacknowledged drifts
- **Output**: Slack Block Kit messages

### Storage

#### S3 Bucket
- **Purpose**: Raw snapshot storage
- **Structure**: `YYYY-MM-DD/HH-MM-SS.json`
- **Retention**: User-defined (recommend 90 days)

#### Supabase
**Tables**:
- `drift_events`: Individual drift records
- `baselines`: Baseline snapshots for comparison
- `snapshots` (optional): Historical snapshots

### Frontend (Next.js)

**Pages**:
- `/`: Dashboard with summary metrics
- `/drifts`: Filterable drift table
- `/baselines`: Current baseline viewer

**Features**:
- Real-time polling (5s interval)
- Severity filtering
- Resource type filtering
- Responsive design with Tailwind CSS

## Data Flow

### Snapshot Flow
1. EventBridge triggers snapshot Lambda at `:00` and `:30`
2. Lambda calls AWS APIs (DescribeInstances, DescribeSecurityGroups)
3. Data transformed into standard `AwsResource` format
4. JSON uploaded to S3 with timestamp key

### Detection Flow
1. EventBridge triggers detect Lambda at `:05` and `:35`
2. Lambda fetches latest snapshot from S3
3. Lambda fetches baseline from Supabase
4. If no baseline:
   - Create baseline from latest snapshot
   - Return (no drift)
5. If baseline exists:
   - Compare resources (by ID)
   - Identify ADDED/REMOVED/MODIFIED
   - Calculate severity for each drift
   - Insert drift events into Supabase

### Alert Flow
1. EventBridge triggers alert Lambda at `:10` and `:40`
2. Lambda queries Supabase for HIGH/CRITICAL unacknowledged drifts
3. For each batch of drifts:
   - Format Slack Block Kit message
   - Send via webhook
4. Return count of alerts sent

## Severity Classification

### CRITICAL
- Security Group rule changes (MODIFIED)
- Security Group deletions (REMOVED)

### HIGH
- EC2 state changes (running ↔ stopped/terminated)
- EC2 instance deletions (REMOVED)

### MEDIUM
- Other configuration changes
- New resources added (ADDED)

### LOW
- Tag-only modifications

## Deployment Architecture

### Backend
- Deployed via Serverless Framework
- IAM role with minimal permissions (EC2 Describe, S3 R/W)
- Environment variables injected at deploy time
- GitHub Actions CI/CD on push to `main`

### Frontend
- Deployed to Vercel
- Server-side rendering disabled (static export)
- Environment variables for Supabase connection
- GitHub Actions CI/CD on frontend changes

## Security Considerations

1. **Secrets Management**:
   - Supabase keys in GitHub Secrets
   - Slack webhook in GitHub Secrets
   - AWS credentials via IAM role (Lambda) or GitHub Secrets (CI/CD)

2. **Access Control**:
   - Lambda IAM role: read-only AWS permissions
   - Supabase: service role key for backend, anon key for frontend
   - Frontend uses Row Level Security (RLS) policies

3. **Data Protection**:
   - Snapshots stored in private S3 bucket
   - Supabase data encrypted at rest
   - No sensitive data in logs

## Scalability

- **Lambda**: Auto-scales, current limit 512MB/300s
- **S3**: Unlimited storage
- **Supabase**: Scales with plan tier
- **EventBridge**: Handles up to 1 million events/month (free tier)

## Monitoring

- **CloudWatch Logs**: Lambda execution logs
- **CloudWatch Metrics**: Lambda invocations, errors, duration
- **Supabase Dashboard**: Query performance, storage usage
- **Slack Alerts**: Real-time notification of critical drifts

## Future Enhancements

1. **Additional Resources**: RDS, S3 buckets, IAM policies, Lambda functions
2. **Real-time Dashboard**: WebSocket connection for live updates
3. **Baseline Management**: UI for creating/updating baselines manually
4. **Drift Acknowledgement**: Frontend button to mark drifts as acknowledged
5. **Trend Analysis**: Historical drift patterns and reporting
6. **Multi-Account**: Support for monitoring multiple AWS accounts
7. **Anomaly Detection**: ML-based prediction of unexpected changes
