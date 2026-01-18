# Deployment Guide

## Backend Deployment (AWS Lambda)

### Prerequisites
- AWS CLI configured with credentials
- Serverless Framework installed (`npm install -g serverless@3`)
- Backend `.env.local` configured

### Manual Deployment

```bash
cd backend
npx serverless deploy --stage prod
```

This will:
1. Package Lambda functions with esbuild
2. Upload to S3
3. Create/update CloudFormation stack
4. Set up EventBridge schedules

### Verify Deployment

Check AWS Console:
1. Lambda functions: `config-drift-detector-prod-snapshot`, `-detect`, `-alert`
2. EventBridge rules: Active cron schedules
3. CloudWatch Logs: `/aws/lambda/config-drift-detector-prod-*`

### Test Lambda Functions

```bash
# Invoke snapshot Lambda
aws lambda invoke --function-name config-drift-detector-prod-snapshot response.json

# Invoke detect Lambda
aws lambda invoke --function-name config-drift-detector-prod-detect response.json

# Invoke alert Lambda
aws lambda invoke --function-name config-drift-detector-prod-alert response.json
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm install -g vercel`)

### Manual Deployment

```bash
cd frontend
vercel login
vercel link
vercel --prod
```

### Set Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## GitHub Actions CI/CD

### Configure Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions

Add the following secrets:

**AWS Credentials**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Supabase**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

**Slack**:
- `SLACK_WEBHOOK_URL`

**Vercel**:
- `VERCEL_TOKEN` (from https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` (from Vercel project settings)
- `VERCEL_PROJECT_ID` (from Vercel project settings)

### Workflows

**test.yml**:
- Runs on push/PR to `main` or `develop`
- Executes backend tests

**deploy-backend.yml**:
- Runs on push to `main` when `backend/**` changes
- Deploys Lambda functions via Serverless Framework

**deploy-frontend.yml**:
- Runs on push to `main` when `frontend/**` changes
- Deploys to Vercel

## Monitoring

### CloudWatch Logs
```bash
# View snapshot Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-snapshot --follow

# View detect Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-detect --follow

# View alert Lambda logs
aws logs tail /aws/lambda/config-drift-detector-prod-alert --follow
```

### CloudWatch Metrics

Monitor:
- Lambda invocations
- Lambda errors
- Lambda duration
- EventBridge rule triggers

### Supabase Dashboard

Check:
- Query performance
- Storage usage
- Connection pool

## Rollback

### Backend Rollback

```bash
cd backend
npx serverless rollback --timestamp TIMESTAMP
```

### Frontend Rollback

In Vercel dashboard:
1. Go to Deployments
2. Find previous deployment
3. Click "..." → "Promote to Production"

## Troubleshooting

### Lambda Timeout
- Increase `timeout` in `serverless.yml`
- Current: 300s (5 minutes)

### Lambda Memory Issues
- Increase `memorySize` in `serverless.yml`
- Current: 512 MB

### S3 Storage Costs
- Implement lifecycle policy to delete old snapshots
- Recommend: Delete snapshots older than 90 days

### Supabase Connection Limits
- Upgrade Supabase plan if needed
- Implement connection pooling

## Cost Estimation

**AWS** (monthly):
- Lambda: ~$5 (2M requests, 512MB, 30s avg duration)
- S3: ~$1 (100GB storage, standard tier)
- EventBridge: Free (under 1M events)
- Total: ~$6/month

**Supabase**:
- Free tier: Sufficient for most use cases
- Pro tier: $25/month (if needed)

**Vercel**:
- Hobby: Free (personal projects)
- Pro: $20/month (team projects)

**Total Estimated Cost**: $6-51/month depending on tier
