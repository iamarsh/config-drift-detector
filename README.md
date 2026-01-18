# Config Drift Detector

A production-ready AWS configuration drift detection system that monitors your AWS infrastructure for changes, analyzes drift severity, and sends automated alerts.

## Architecture

The system consists of three main components:

1. **Backend (AWS Lambda)**: Serverless functions that:
   - Take periodic snapshots of AWS resources (EC2, Security Groups)
   - Detect configuration drift by comparing against baselines
   - Send Slack alerts for critical changes

2. **Frontend (Next.js)**: Real-time dashboard that:
   - Displays drift events and severity metrics
   - Provides filtering and search capabilities
   - Shows baseline configurations

3. **Storage**:
   - S3: Raw snapshot storage
   - Supabase: Drift events, baselines, and metadata

## System Flow

```
EventBridge (every 30 min)
    └─> Snapshot Lambda ──> S3
            └─> Detect Lambda ──> Supabase
                    └─> Alert Lambda ──> Slack
                            └─> Dashboard (Next.js)
```

## Features

- **Automated Monitoring**: Periodic snapshots every 30 minutes
- **Intelligent Drift Detection**: Classifies changes as ADDED/REMOVED/MODIFIED
- **Severity Classification**:
  - 🔴 CRITICAL: Security Group rule changes
  - 🟠 HIGH: EC2 state changes
  - 🟡 MEDIUM: Other configuration changes
  - 🟢 LOW: Tag-only changes
- **Real-time Alerts**: Slack notifications for HIGH/CRITICAL drifts
- **Interactive Dashboard**: Browse, filter, and analyze drift events

## Project Structure

```
config-drift-detector/
├── backend/           # Lambda functions + shared utilities
├── frontend/          # Next.js dashboard
├── docs/              # Architecture and setup documentation
├── memory-bank/       # Project goals and decisions
└── .github/workflows/ # CI/CD pipelines
```

## Quick Start

See [docs/setup.md](docs/setup.md) for detailed setup instructions.

### Prerequisites

- Node.js 20+
- AWS Account with EC2/S3 permissions
- Supabase project
- Slack workspace (for alerts)

### Installation

```bash
# Clone the repository
git clone https://github.com/iamarsh/config-drift-detector.git
cd config-drift-detector

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

### Development

```bash
# Backend
cd backend
npm run build
npm test

# Frontend
cd frontend
npm run dev
```

### Deployment

```bash
# Deploy backend (Serverless Framework)
cd backend
npx serverless deploy --stage prod

# Deploy frontend (Vercel)
cd frontend
vercel --prod
```

## Documentation

- [Architecture](docs/architecture.md) - System design and data flow
- [Setup Guide](docs/setup.md) - Local development setup
- [Deployment](docs/deployment.md) - Production deployment guide
- [API Reference](docs/api.md) - Supabase schema and Lambda APIs

## Tech Stack

**Backend**:
- AWS Lambda (Node.js 20)
- AWS SDK v3
- Serverless Framework
- TypeScript
- Supabase
- Pino (logging)

**Frontend**:
- Next.js (App Router)
- React 18
- TypeScript
- TailwindCSS
- Supabase Client

**Infrastructure**:
- AWS S3, EventBridge, Lambda
- GitHub Actions (CI/CD)
- Vercel (frontend hosting)

## Contributing

This is a personal project. For bugs or feature requests, please open an issue.

## License

MIT License - see LICENSE file for details
