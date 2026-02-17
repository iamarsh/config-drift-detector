-- CloudWatch Logs Insights Query: Performance P95
-- Description: Calculate 95th percentile latency for Lambda functions
-- Usage: Run in CloudWatch Logs Insights console for Lambda log groups

fields @timestamp, duration, memoryUsed, operation
| filter ispresent(duration)
| stats
    avg(duration) as avg_duration_ms,
    max(duration) as max_duration_ms,
    pct(duration, 95) as p95_duration_ms,
    count(*) as invocation_count
  by operation
| sort p95_duration_ms desc
