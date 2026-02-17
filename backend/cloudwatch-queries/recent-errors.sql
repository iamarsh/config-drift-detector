-- CloudWatch Logs Insights Query: Recent Errors
-- Description: Find all ERROR level logs from the last 24 hours
-- Usage: Run in CloudWatch Logs Insights console for Lambda log groups

fields @timestamp, level, msg, errorType, errorMessage, stackTrace
| filter level = "error"
| sort @timestamp desc
| limit 100
