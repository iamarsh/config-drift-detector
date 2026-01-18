# Config Drift Detector - Backend

Lambda functions for AWS configuration drift detection.

## Structure

```
backend/
├── src/
│   ├── lambdas/         # Lambda handler functions
│   │   ├── snapshot.ts  # AWS resource snapshot collection
│   │   ├── detect.ts    # Drift detection logic
│   │   └── alert.ts     # Slack alerting
│   └── shared/          # Shared utilities
│       ├── aws-client.ts      # AWS SDK wrapper
│       ├── supabase-client.ts # Supabase client
│       ├── slack-client.ts    # Slack webhook client
│       ├── logger.ts          # Pino logger
│       ├── types.ts           # TypeScript types
│       └── utils.ts           # Helper functions
├── tests/               # Unit tests
├── serverless.yml       # Serverless Framework config
└── tsconfig.json        # TypeScript config
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Clean build artifacts
npm run clean
```

## Testing Locally

```bash
# Test snapshot function
node dist/lambdas/snapshot.js

# Test detect function
node dist/lambdas/detect.js

# Test alert function
node dist/lambdas/alert.js
```

## Deployment

```bash
# Deploy to AWS
npx serverless deploy --stage prod

# View logs
npx serverless logs -f snapshot --stage prod
```

## Environment Variables

See `.env.example` for required environment variables.
