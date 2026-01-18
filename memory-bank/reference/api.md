# API Reference

## Supabase Schema

### Table: `drift_events`

Stores individual drift detection records.

**Columns**:
- `id` (UUID, PK): Unique identifier
- `account_id` (TEXT): AWS account ID
- `resource_id` (TEXT): AWS resource ID (e.g., i-123456789)
- `resource_type` (TEXT): Resource type (EC2, SecurityGroup, etc.)
- `change_type` (TEXT): Type of change (ADDED, REMOVED, MODIFIED)
- `severity` (TEXT): Severity level (LOW, MEDIUM, HIGH, CRITICAL)
- `detected_at` (TIMESTAMPTZ): When drift was detected
- `acknowledged` (BOOLEAN): Whether drift has been acknowledged
- `previous_state` (JSONB, nullable): State before change
- `current_state` (JSONB, nullable): State after change

**Indexes**:
- `idx_drift_events_account_id` on `account_id`
- `idx_drift_events_severity` on `severity`
- `idx_drift_events_acknowledged` on `acknowledged`

**Example Row**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "218885889357",
  "resource_id": "i-0abc123def456789",
  "resource_type": "EC2",
  "change_type": "MODIFIED",
  "severity": "HIGH",
  "detected_at": "2026-01-18T10:35:00Z",
  "acknowledged": false,
  "previous_state": {"state": "running", "instanceType": "t2.micro"},
  "current_state": {"state": "stopped", "instanceType": "t2.micro"}
}
```

---

### Table: `baselines`

Stores baseline snapshots for drift comparison.

**Columns**:
- `id` (UUID, PK): Unique identifier
- `account_id` (TEXT): AWS account ID
- `snapshot` (JSONB): Full AWS snapshot
- `created_at` (TIMESTAMPTZ): When baseline was created

**Indexes**:
- `idx_baselines_account_id` on `account_id`

**Example Row**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "account_id": "218885889357",
  "snapshot": {
    "accountId": "218885889357",
    "region": "us-east-2",
    "timestamp": "2026-01-18T10:00:00Z",
    "resources": [
      {
        "id": "i-0abc123def456789",
        "type": "EC2",
        "name": "web-server-1",
        "state": {
          "instanceType": "t2.micro",
          "state": "running",
          "privateIpAddress": "10.0.1.5"
        },
        "tags": {
          "Name": "web-server-1",
          "Environment": "production"
        },
        "region": "us-east-2",
        "accountId": "218885889357"
      }
    ]
  },
  "created_at": "2026-01-18T10:00:00Z"
}
```

---

## Lambda Function APIs

### Function: `snapshot`

**Description**: Captures current AWS resource state and stores in S3.

**Trigger**: EventBridge cron (`cron(0,30 * * * ? *)`)

**Input**: EventBridge event (unused)

**Output**:
```typescript
{
  success: boolean
  snapshotKey?: string          // S3 key of snapshot
  resourceCount: number          // Number of resources captured
  timestamp: string             // ISO 8601 timestamp
  error?: string                // Error message if failed
}
```

**Example Output**:
```json
{
  "success": true,
  "snapshotKey": "2026-01-18/10-00-00.json",
  "resourceCount": 42,
  "timestamp": "2026-01-18T10:00:00Z"
}
```

**Side Effects**:
- Creates file in S3: `s3://config-drift-snapshots-218885889357/YYYY-MM-DD/HH-MM-SS.json`

---

### Function: `detect`

**Description**: Compares latest snapshot against baseline to detect drift.

**Trigger**: EventBridge cron (`cron(5,35 * * * ? *)`)

**Input**: EventBridge event (unused)

**Output**:
```typescript
{
  success: boolean
  driftCount: number            // Number of drifts detected
  drifts: DriftEvent[]          // Array of drift events
  baselineExists: boolean       // Whether baseline was found
  timestamp: string             // ISO 8601 timestamp
  error?: string                // Error message if failed
}
```

**Example Output**:
```json
{
  "success": true,
  "driftCount": 3,
  "drifts": [
    {
      "accountId": "218885889357",
      "resourceId": "i-0abc123def456789",
      "resourceType": "EC2",
      "changeType": "MODIFIED",
      "severity": "HIGH",
      "detectedAt": "2026-01-18T10:05:00Z",
      "acknowledged": false,
      "previousState": {"state": "running"},
      "currentState": {"state": "stopped"}
    }
  ],
  "baselineExists": true,
  "timestamp": "2026-01-18T10:05:00Z"
}
```

**Side Effects**:
- If no baseline: Inserts row into `baselines` table
- If baseline exists: Inserts rows into `drift_events` table

---

### Function: `alert`

**Description**: Sends Slack alerts for HIGH/CRITICAL unacknowledged drifts.

**Trigger**: EventBridge cron (`cron(10,40 * * * ? *)`)

**Input**: EventBridge event (unused)

**Output**:
```typescript
{
  success: boolean
  alertsSent: number            // Number of alerts sent
  timestamp: string             // ISO 8601 timestamp
  error?: string                // Error message if failed
}
```

**Example Output**:
```json
{
  "success": true,
  "alertsSent": 2,
  "timestamp": "2026-01-18T10:10:00Z"
}
```

**Side Effects**:
- Sends Slack message via webhook

---

## Slack Webhook Payload

**Format**: Slack Block Kit

**Example**:
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔴 AWS Config Drift Detected (2 changes)"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Account:* 218885889357\n*Detected:* 1/18/2026, 10:10:00 AM"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Resource:*\ni-0abc123def456789"
        },
        {
          "type": "mrkdwn",
          "text": "*Type:*\nEC2"
        },
        {
          "type": "mrkdwn",
          "text": "*Change:*\nMODIFIED"
        },
        {
          "type": "mrkdwn",
          "text": "*Severity:*\n🔴 HIGH"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Action Required:* Review changes in the dashboard and acknowledge if expected."
      }
    }
  ]
}
```

---

## S3 Snapshot Format

**Bucket**: `config-drift-snapshots-218885889357`

**Key Format**: `YYYY-MM-DD/HH-MM-SS.json`

**Content**:
```json
{
  "accountId": "218885889357",
  "region": "us-east-2",
  "timestamp": "2026-01-18T10:00:00.000Z",
  "resources": [
    {
      "id": "i-0abc123def456789",
      "type": "EC2",
      "name": "web-server-1",
      "state": {
        "instanceType": "t2.micro",
        "state": "running",
        "privateIpAddress": "10.0.1.5",
        "publicIpAddress": "54.123.45.67",
        "vpcId": "vpc-0123456789",
        "subnetId": "subnet-0123456789",
        "securityGroups": [
          {
            "id": "sg-0123456789",
            "name": "web-sg"
          }
        ],
        "launchTime": "2026-01-15T08:30:00.000Z",
        "platform": null,
        "architecture": "x86_64"
      },
      "tags": {
        "Name": "web-server-1",
        "Environment": "production",
        "Team": "platform"
      },
      "region": "us-east-2",
      "accountId": "218885889357"
    },
    {
      "id": "sg-0123456789",
      "type": "SecurityGroup",
      "name": "web-sg",
      "state": {
        "description": "Web server security group",
        "vpcId": "vpc-0123456789",
        "ingressRules": [
          {
            "ipProtocol": "tcp",
            "fromPort": 80,
            "toPort": 80,
            "ipRanges": ["0.0.0.0/0"]
          },
          {
            "ipProtocol": "tcp",
            "fromPort": 443,
            "toPort": 443,
            "ipRanges": ["0.0.0.0/0"]
          }
        ],
        "egressRules": [
          {
            "ipProtocol": "-1",
            "fromPort": null,
            "toPort": null,
            "ipRanges": ["0.0.0.0/0"]
          }
        ]
      },
      "tags": {
        "Name": "web-sg",
        "Environment": "production"
      },
      "region": "us-east-2",
      "accountId": "218885889357"
    }
  ]
}
```

---

## Environment Variables

### Backend Lambdas

**Required**:
- `AWS_ACCOUNT_ID`: AWS account ID (e.g., "218885889357")
- `AWS_REGION`: AWS region (e.g., "us-east-2")
- `S3_BUCKET_NAME`: S3 bucket for snapshots
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for backend)
- `SLACK_WEBHOOK_URL`: Slack incoming webhook URL

**Optional**:
- `NODE_ENV`: Environment (default: "production")
- `LOG_LEVEL`: Log level (default: "info")

### Frontend (Next.js)

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (for frontend)

---

## Error Codes

### Lambda Errors

- **AwsClient Errors**:
  - `EC2.UnauthorizedOperation`: IAM role lacks EC2 permissions
  - `S3.AccessDenied`: IAM role lacks S3 permissions

- **SupabaseClient Errors**:
  - `PGRST116`: No rows returned (not necessarily an error)
  - `Connection refused`: Network issue or Supabase down

- **SlackClient Errors**:
  - `HTTP 404`: Invalid webhook URL
  - `HTTP 400`: Malformed payload

### HTTP Status Codes (Frontend API)

Not applicable - frontend uses Supabase client SDK directly.
