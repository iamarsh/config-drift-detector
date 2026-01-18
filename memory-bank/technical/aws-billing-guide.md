# AWS Billing Guide & Cost Analysis

## Overview

This guide provides detailed AWS cost analysis and strategies to avoid unexpected charges.

## TL;DR - Will I Get Charged?

**For your current setup with minimal EC2 instances:**

**Estimated Monthly Cost: $0.10 - $2.00** ✅

Most services fall within AWS Free Tier limits for the first 12 months.

## Detailed Cost Breakdown

### 1. AWS Lambda

**Your Configuration**:
- 3 functions (snapshot, detect, alert)
- 512 MB memory allocation
- Estimated 30 seconds execution time per function
- Runs every 30 minutes = 48 times per day = 1,440 times per month

**Cost Calculation**:
```
Free Tier (first 12 months):
- 1 million requests/month: FREE
- 400,000 GB-seconds: FREE

Your Usage:
- Requests: 1,440 × 3 = 4,320 requests/month
- GB-seconds: (512 MB / 1024) × 30s × 4,320 = 64,800 GB-seconds

Status: ✅ FULLY COVERED BY FREE TIER
Estimated Cost: $0.00/month
```

**After Free Tier Expires**:
- Request charges: $0.20 per 1M requests = $0.001/month
- Duration charges: $0.0000166667 per GB-second = $1.08/month
- **Total: ~$1.08/month**

### 2. AWS S3

**Your Configuration**:
- Bucket: `config-drift-snapshots-218885889357`
- Snapshots: 48 per day (every 30 minutes)
- Estimated snapshot size: 50 KB (for ~10 EC2 instances + Security Groups)

**Cost Calculation**:
```
Free Tier (first 12 months):
- 5 GB storage: FREE
- 20,000 GET requests: FREE
- 2,000 PUT requests: FREE

Your Usage:
- Storage: 48 snapshots/day × 50 KB × 30 days = 70 MB/month
- PUT requests: 48/day × 30 = 1,440/month
- GET requests (for detect lambda): 1,440/month

Status: ✅ FULLY COVERED BY FREE TIER
Estimated Cost: $0.00/month
```

**After Free Tier Expires**:
- Storage: $0.023 per GB = $0.002/month (for 70 MB)
- PUT requests: $0.005 per 1,000 = $0.007/month
- GET requests: $0.0004 per 1,000 = $0.001/month
- **Total: ~$0.01/month**

**With 90-day retention** (recommended):
- Storage: ~210 MB = $0.005/month
- **Total: ~$0.015/month**

### 3. Amazon EventBridge (CloudWatch Events)

**Your Configuration**:
- 3 scheduled rules (one per Lambda)
- Triggers 48 times per day

**Cost Calculation**:
```
Free Tier (always free):
- First 1 million events/month: FREE

Your Usage:
- 48 triggers/day × 3 rules × 30 days = 4,320 events/month

Status: ✅ ALWAYS FREE
Estimated Cost: $0.00/month
```

### 4. AWS CloudWatch Logs

**Your Configuration**:
- 3 Lambda functions generating logs
- Estimated 10 KB per execution

**Cost Calculation**:
```
Free Tier (first 12 months):
- 5 GB ingestion: FREE
- 5 GB storage: FREE

Your Usage:
- Log ingestion: 4,320 executions × 10 KB = 43 MB/month
- Log storage: ~130 MB (with 3-month retention)

Status: ✅ FULLY COVERED BY FREE TIER
Estimated Cost: $0.00/month
```

**After Free Tier Expires**:
- Ingestion: $0.50 per GB = $0.02/month
- Storage: $0.03 per GB = $0.004/month
- **Total: ~$0.024/month**

### 5. AWS EC2 API Calls

**Your Configuration**:
- DescribeInstances and DescribeSecurityGroups
- Called every 30 minutes

**Cost**: ✅ FREE - Read API calls are not charged

### 6. External Services

**Supabase**:
- Free tier: Up to 500 MB database, 2 GB bandwidth
- Your usage: ~5 MB database, ~50 MB bandwidth/month
- **Cost: $0.00/month** (well within free tier)

**Vercel**:
- Hobby tier: FREE for personal projects
- **Cost: $0.00/month**

**Slack**:
- Free tier: Unlimited messages
- **Cost: $0.00/month**

## Total Cost Summary

### During AWS Free Tier (First 12 Months)

| Service | Monthly Cost |
|---------|--------------|
| Lambda | $0.00 |
| S3 | $0.00 |
| EventBridge | $0.00 |
| CloudWatch Logs | $0.00 |
| **TOTAL** | **$0.00** |

### After AWS Free Tier Expires

| Service | Monthly Cost |
|---------|--------------|
| Lambda | $1.08 |
| S3 (with 90-day retention) | $0.02 |
| EventBridge | $0.00 |
| CloudWatch Logs | $0.02 |
| **TOTAL** | **~$1.12/month** |

## Cost Optimization Strategies

### 1. Implement S3 Lifecycle Policy

Automatically delete old snapshots to reduce storage costs:

```bash
# Create lifecycle policy JSON
cat > lifecycle-policy.json <<'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldSnapshots",
      "Status": "Enabled",
      "Filter": {},
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

# Apply to bucket
aws s3api put-bucket-lifecycle-configuration \
  --bucket config-drift-snapshots-218885889357 \
  --lifecycle-configuration file://lifecycle-policy.json
```

**Savings**: Prevents unlimited storage growth

### 2. Optimize Lambda Memory

Current: 512 MB - May be excessive for this workload

Test with 256 MB:
```yaml
# In serverless.yml
provider:
  memorySize: 256  # Reduced from 512
```

**Potential Savings**: 50% reduction in Lambda duration costs

### 3. Adjust Snapshot Frequency

Current: Every 30 minutes

Alternative: Every 1 hour
```yaml
# In serverless.yml
functions:
  snapshot:
    events:
      - schedule: cron(0 * * * ? *)  # Every hour
```

**Savings**: 50% reduction in all costs

**Trade-off**: Increased detection latency (up to 1 hour)

### 4. CloudWatch Logs Retention

Reduce log retention from indefinite to 30 days:

```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/config-drift-detector-prod-snapshot \
  --retention-in-days 30

aws logs put-retention-policy \
  --log-group-name /aws/lambda/config-drift-detector-prod-detect \
  --retention-in-days 30

aws logs put-retention-policy \
  --log-group-name /aws/lambda/config-drift-detector-prod-alert \
  --retention-in-days 30
```

**Savings**: Reduces log storage costs by ~70%

### 5. Use AWS Budgets for Alerts

Set up billing alerts to avoid surprises:

```bash
# Create a budget
aws budgets create-budget \
  --account-id 218885889357 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**budget.json**:
```json
{
  "BudgetName": "ConfigDriftDetector",
  "BudgetLimit": {
    "Amount": "5",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

## Monitoring Your Costs

### 1. AWS Cost Explorer

View costs: https://console.aws.amazon.com/cost-management/home#/cost-explorer

Filter by:
- Service: Lambda, S3, CloudWatch
- Tag: `Project:ConfigDriftDetector` (if you tag resources)

### 2. AWS Billing Dashboard

Current month charges: https://console.aws.amazon.com/billing/home#/bills

**Set up billing alerts**:
1. Go to: https://console.aws.amazon.com/billing/home#/preferences
2. Enable "Receive Billing Alerts"
3. Create CloudWatch alarm for threshold

### 3. Cost Breakdown by Resource

View itemized costs:
```bash
# Get cost by service for current month
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE
```

## Avoiding Unexpected Charges

### Common Cost Traps (And How This Project Avoids Them)

❌ **Lambda running indefinitely**
✅ Protected: 300-second timeout configured

❌ **S3 bucket growing unbounded**
✅ Protected: Implement lifecycle policy (see above)

❌ **High Lambda concurrency**
✅ Protected: Sequential execution, low frequency

❌ **NAT Gateway charges**
✅ Protected: No VPC/NAT Gateway used

❌ **Data transfer charges**
✅ Protected: All resources in same region (us-east-2)

### Red Flags to Watch For

🚩 **Lambda invocations > 10,000/month**
- Check EventBridge rules not duplicated
- Verify no infinite loops

🚩 **S3 storage > 1 GB**
- Implement lifecycle policy
- Check for orphaned snapshots

🚩 **CloudWatch Logs > 1 GB**
- Reduce log retention
- Check for excessive logging

## Cost Projections

### Small Deployment (5-10 EC2 instances)
- Current setup
- **Cost: $0.00 (Free Tier) → $1.12/month (Post-Free Tier)**

### Medium Deployment (50-100 EC2 instances)
- Larger snapshots (~500 KB each)
- Increased Lambda duration (~60s)
- **Cost: $0.00 (Free Tier) → $3-5/month (Post-Free Tier)**

### Large Deployment (500+ EC2 instances)
- Very large snapshots (~5 MB each)
- Increased Lambda duration (~180s)
- May need Lambda timeout increase
- **Cost: $0.00 (Free Tier) → $15-25/month (Post-Free Tier)**

## Questions & Answers

### Q: When will I start getting charged?

**A**: Only after your AWS Free Tier expires (12 months after account creation). Even then, estimated cost is ~$1-2/month.

### Q: How can I verify I won't be charged today?

**A**:
1. Check Free Tier status: https://console.aws.amazon.com/billing/home#/freetier
2. Set up $5 budget alert (see above)
3. Monitor first month in Cost Explorer

### Q: What if I exceed Free Tier limits?

**A**: With current usage, you'd need to:
- Run for 230+ hours/month to exceed Lambda free tier
- Store 5+ GB to exceed S3 free tier
- Send 1M+ events to exceed EventBridge free tier

**Conclusion**: Virtually impossible with current setup.

### Q: How do I stop all charges immediately?

**A**:
```bash
# Delete Lambda functions
npx serverless remove --stage prod

# Delete S3 bucket
aws s3 rb s3://config-drift-snapshots-218885889357 --force

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /aws/lambda/config-drift-detector-prod-snapshot
aws logs delete-log-group --log-group-name /aws/lambda/config-drift-detector-prod-detect
aws logs delete-log-group --log-group-name /aws/lambda/config-drift-detector-prod-alert
```

### Q: Are there any hidden costs?

**A**: No hidden costs. All services used:
- Lambda: Charged only for compute time
- S3: Charged only for storage + requests
- EventBridge: Always free under 1M events
- CloudWatch: Charged only for logs
- EC2 API calls: Always free for read operations

## Recommendations

1. **Set up billing alerts** (5 minutes)
   - Create $5 budget as safety net
   - Receive email if approaching limit

2. **Implement S3 lifecycle policy** (2 minutes)
   - Delete snapshots older than 90 days
   - Prevents unlimited storage growth

3. **Monitor first month** (ongoing)
   - Check Cost Explorer weekly
   - Verify charges remain $0.00

4. **Review after Free Tier expires** (in 12 months)
   - Evaluate if ~$1/month is acceptable
   - Consider reducing snapshot frequency if needed

## Conclusion

**Your AWS charges for this project will be:**
- **$0.00/month for first 12 months** (Free Tier)
- **~$1-2/month after Free Tier expires**

This is significantly cheaper than almost any commercial drift detection solution, which typically costs $50-500/month.

**You will NOT get unexpected charges** with this setup, provided you:
1. Don't modify the Lambda schedules to run more frequently
2. Implement S3 lifecycle policy
3. Set up billing alerts as recommended

## Support

For billing questions:
- AWS Support: https://console.aws.amazon.com/support/home
- AWS Billing Forum: https://forums.aws.amazon.com/forum.jspa?forumID=69
- AWS Cost Calculator: https://calculator.aws/
