# CloudWatch Logs Insights Queries

This directory contains pre-built CloudWatch Logs Insights queries for monitoring and troubleshooting the Config Drift Detector Lambda functions.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Access to CloudWatch Logs Insights console
- Lambda functions deployed with structured logging (MON-001)

## Available Queries

### 1. Recent Errors (`recent-errors.sql`)

**Purpose**: Find all ERROR level logs from the last 24 hours across all Lambda functions.

**Usage**:
```bash
# Via AWS Console
1. Open CloudWatch Console → Logs → Insights
2. Select log groups: /aws/lambda/config-drift-detector-prod-*
3. Paste query from recent-errors.sql
4. Set time range: Last 24 hours
5. Click "Run query"

# Via AWS CLI
aws logs start-query \
  --log-group-names \
    "/aws/lambda/config-drift-detector-prod-snapshot" \
    "/aws/lambda/config-drift-detector-prod-detect" \
    "/aws/lambda/config-drift-detector-prod-alert" \
  --start-time $(date -u -d '24 hours ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string "$(cat recent-errors.sql)"
```

**When to use**:
- Investigating production incidents
- Daily operational health checks
- Identifying recurring error patterns

---

### 2. Failed Drift Insertions (`failed-drift-insertions.sql`)

**Purpose**: Find drift detection failures related to Supabase database insertion errors.

**Usage**:
```bash
# Via AWS Console
1. Open CloudWatch Console → Logs → Insights
2. Select log group: /aws/lambda/config-drift-detector-prod-detect
3. Paste query from failed-drift-insertions.sql
4. Set time range: Last 7 days
5. Click "Run query"

# Via AWS CLI
aws logs start-query \
  --log-group-name "/aws/lambda/config-drift-detector-prod-detect" \
  --start-time $(date -u -d '7 days ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string "$(cat failed-drift-insertions.sql)"
```

**When to use**:
- Debugging missing drift events in the dashboard
- Investigating Supabase connectivity issues
- Troubleshooting batch insertion failures

---

### 3. Performance P95 (`performance-p95.sql`)

**Purpose**: Calculate 95th percentile latency and performance metrics for Lambda functions.

**Usage**:
```bash
# Via AWS Console
1. Open CloudWatch Console → Logs → Insights
2. Select log groups: /aws/lambda/config-drift-detector-prod-*
3. Paste query from performance-p95.sql
4. Set time range: Last 7 days
5. Click "Run query"

# Via AWS CLI
aws logs start-query \
  --log-group-names \
    "/aws/lambda/config-drift-detector-prod-snapshot" \
    "/aws/lambda/config-drift-detector-prod-detect" \
    "/aws/lambda/config-drift-detector-prod-alert" \
  --start-time $(date -u -d '7 days ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string "$(cat performance-p95.sql)"
```

**When to use**:
- Monitoring Lambda performance trends
- Identifying slow operations needing optimization
- Capacity planning and cost optimization
- Validating performance after code changes

---

## Query Results Interpretation

### Recent Errors
- **High error count**: Check `errorType` and `errorMessage` for patterns
- **Specific error types**:
  - `SupabaseError`: Database connectivity issues
  - `AWS SDK errors`: IAM permissions or API throttling
  - `TimeoutError`: Function timeout needs increase

### Failed Drift Insertions
- **Recurring failures**: Check Supabase service status and connection limits
- **detectionRunId**: Use to correlate with snapshot S3 keys
- **driftCount**: Large numbers may indicate batch size tuning needed

### Performance P95
- **p95 > timeout threshold**: Risk of function timeouts, increase timeout
- **High memory usage**: Consider increasing Lambda memory allocation
- **operation bottlenecks**: Focus optimization efforts on slowest operations

---

## Query Customization

All queries can be customized:

```sql
-- Adjust time window
| filter @timestamp > ago(3h)

-- Filter by specific run ID
| filter detectionRunId = "abc123..."

-- Add fields
fields @timestamp, level, msg, customField

-- Aggregate differently
| stats count(*) by errorType, bin(5m)
```

---

## Cost Considerations

- **CloudWatch Logs Insights pricing**: $0.005 per GB scanned
- **Free tier**: 5 GB ingestion per month
- **Optimization tips**:
  - Use narrow time ranges (24h instead of 30d)
  - Filter early in query (reduce data scanned)
  - Avoid `SELECT *` patterns, specify fields

---

## Troubleshooting

### "No results found"
1. Verify log groups exist: `aws logs describe-log-groups --log-group-name-prefix /aws/lambda/config-drift-detector`
2. Check time range includes recent Lambda executions
3. Verify structured logging is deployed (MON-001)

### Query syntax errors
- Ensure no trailing semicolons
- Use single quotes for string literals
- Check field names match logger output

### Performance issues
- Add `| limit 100` to cap result size
- Use `bin()` for time-based aggregation instead of raw timestamps
- Filter by `level` or other indexed fields early in query

---

## Related Documentation

- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Lambda Structured Logging (MON-001)](../../memory-bank/progress.md#cloudwatch-monitoring-mar-2026)
- [Production Deployment Guide](../../docs/deployment.md)

---

## Contributing

When adding new queries:
1. Use descriptive filenames (e.g., `high-memory-usage.sql`)
2. Include SQL comments explaining purpose and usage
3. Add documentation section to this README
4. Test query in console before committing
5. Consider cost implications (data scanned)
