# Slack Webhook Setup Guide

## Overview

This guide walks you through getting the Slack Incoming Webhook URL that the alert Lambda uses to send drift notifications.

## Prerequisites

- Slack workspace where you have admin permissions
- A channel designated for drift alerts (recommended: `#aws-drift-alerts` or `#infrastructure-alerts`)

## Step-by-Step Setup

### 1. Access Slack App Dashboard

Go to: https://api.slack.com/apps

Log in with your Slack workspace credentials.

### 2. Create a New App (If You Haven't Already)

If you already created the app, skip to Step 3.

1. Click **"Create New App"**
2. Choose **"From scratch"**
3. Fill in:
   - **App Name**: `Config Drift Detector`
   - **Workspace**: Select your workspace
4. Click **"Create App"**

### 3. Enable Incoming Webhooks

1. In the left sidebar, click **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **On**

### 4. Add Webhook to Workspace

1. Scroll down to **"Webhook URLs for Your Workspace"**
2. Click **"Add New Webhook to Workspace"**
3. Select the channel for alerts (e.g., `#aws-drift-alerts`)
4. Click **"Allow"**

### 5. Copy the Webhook URL

After authorization, you'll see your webhook URL in the format:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**IMPORTANT**: Keep this URL secure! It allows posting to your Slack channel.

### 6. Update Your Configuration

#### Local Development

Edit `backend/.env.local`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_ACTUAL_WEBHOOK_URL
```

Replace the entire URL with the one you copied.

#### Production (GitHub Secrets)

1. Go to: https://github.com/iamarsh/config-drift-detector/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `SLACK_WEBHOOK_URL`
4. Value: Paste your webhook URL
5. Click **"Add secret"**

### 7. Test the Webhook

Test from command line:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🔴 Test Alert: Config Drift Detector is now connected!"}' \
  https://hooks.slack.com/services/YOUR_ACTUAL_WEBHOOK_URL
```

You should see a message appear in your Slack channel immediately.

### 8. Test the Alert Lambda

After updating `backend/.env.local`:

```bash
cd backend
npm run build
node dist/lambdas/alert.js
```

If you have HIGH or CRITICAL unacknowledged drifts in Supabase, you'll receive a formatted alert.

## Webhook URL Format

Your webhook URL should look like:
```
https://hooks.slack.com/services/T{WORKSPACE_ID}/B{CHANNEL_ID}/{TOKEN}
```

Example:
```
https://hooks.slack.com/services/T0123ABCD/B0123EFGH/XXXXXXXXXXXXXXXXXXXX
```

## Customizing Alert Messages

The alert messages use Slack's Block Kit format. To customize:

1. Edit `backend/src/shared/slack-client.ts`
2. Modify the `buildAlertBlocks()` method
3. Use Block Kit Builder for testing: https://app.slack.com/block-kit-builder

## Troubleshooting

### Webhook Returns 404 Not Found

**Problem**: Invalid webhook URL

**Solution**:
- Verify you copied the complete URL from Step 5
- Check for extra spaces or line breaks
- Regenerate webhook if needed (Step 4)

### Webhook Returns 400 Bad Request

**Problem**: Malformed JSON payload

**Solution**:
- Check your test curl command has proper JSON
- Verify the Lambda code in `slack-client.ts` generates valid JSON
- Test payload at: https://app.slack.com/block-kit-builder

### No Messages Appearing in Slack

**Problem**: Webhook may be disabled or channel archived

**Solution**:
1. Verify channel exists and is not archived
2. Check webhook is still listed in Slack app settings
3. Test with simple curl command first
4. Check Lambda CloudWatch logs for errors

### "channel_not_found" Error

**Problem**: The channel you authorized was deleted or renamed

**Solution**:
1. Go back to Slack app dashboard
2. Remove old webhook
3. Create new webhook (Step 4) with existing channel

## Security Best Practices

1. **Never commit webhook URLs to git**
   - Already handled: `.env.local` is in `.gitignore`

2. **Rotate webhooks periodically**
   - Recommended: Every 90 days for production

3. **Use GitHub Encrypted Secrets**
   - Already configured in CI/CD workflows

4. **Limit webhook permissions**
   - Webhooks can only post to the authorized channel
   - Cannot read messages or access other channels

5. **Monitor webhook usage**
   - Check Slack app dashboard for unusual activity
   - Set up alerts for excessive posting

## Advanced Configuration

### Multiple Channels

To send alerts to multiple channels:

1. Create multiple webhooks (one per channel)
2. Store all URLs in environment:
   ```bash
   SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/.../critical
   SLACK_WEBHOOK_INFO=https://hooks.slack.com/services/.../info
   ```
3. Modify `alert.ts` to route by severity

### Custom Alert Formatting

Edit `backend/src/shared/slack-client.ts`:

```typescript
private buildAlertBlocks(drifts: DriftEvent[]): SlackBlock[] {
  // Customize header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🚨 Custom Alert Title Here'
    }
  });

  // Add custom fields, buttons, images, etc.
  // See: https://api.slack.com/reference/block-kit/blocks
}
```

### Rate Limiting

Current implementation sends one message per batch. To avoid rate limits:

- Max 1 message per second (Slack limit)
- Current: Sends every 30 minutes (well within limit)
- If increasing frequency, add throttling in `alert.ts`

## Example Alert Message

Here's what a production alert looks like:

```
🔴 AWS Config Drift Detected (3 changes)

Account: 218885889357
Detected: 1/18/2026, 10:10:00 AM

━━━━━━━━━━━━━━━━━━━━━━━

Resource: sg-0abc123def
Type: SecurityGroup
Change: MODIFIED
Severity: 🔴 CRITICAL

Resource: i-0xyz789abc
Type: EC2
Change: MODIFIED
Severity: 🟠 HIGH

Resource: i-0def456ghi
Type: EC2
Change: REMOVED
Severity: 🟠 HIGH

━━━━━━━━━━━━━━━━━━━━━━━

Action Required: Review changes in the dashboard and acknowledge if expected.
```

## Support

If you encounter issues:
1. Check CloudWatch Logs: `/aws/lambda/config-drift-detector-prod-alert`
2. Test webhook with curl
3. Verify JSON payload format
4. Check Slack API status: https://status.slack.com/

## Next Steps

After configuring Slack:
1. Test locally with `node dist/lambdas/alert.js`
2. Deploy to production with `serverless deploy`
3. Monitor first scheduled execution in CloudWatch
4. Verify alert arrives in Slack within 40 minutes of first snapshot
