-- CloudWatch Logs Insights Query: Failed Drift Insertions
-- Description: Find drift detection failures related to Supabase insertion errors
-- Usage: Run in CloudWatch Logs Insights console for detect Lambda log group

fields @timestamp, level, msg, errorType, errorMessage, driftCount, detectionRunId
| filter msg like /drift insertion/ or errorType like /SupabaseError/
| filter level = "error"
| sort @timestamp desc
| limit 50
