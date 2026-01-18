# Memory Bank - Documentation Index

## Directory Structure

```
memory-bank/
├── README.md                      # This file - Documentation index
├── project-goals.md               # Project vision and milestones
├── decisions.log.md               # Architecture decision records (ADRs)
├── progress.md                    # Implementation progress tracking
├── technical/                     # Technical documentation
│   ├── architecture.md           # System design and data flow
│   └── aws-billing-guide.md      # AWS cost analysis and optimization
├── operational/                   # Setup and deployment guides
│   ├── setup.md                  # Local development setup
│   ├── deployment.md             # Production deployment guide
│   └── slack-webhook-setup.md   # Slack app and webhook configuration
└── reference/                     # API and schema references
    └── api.md                    # Supabase schema and Lambda APIs
```

## Quick Links

### Getting Started
- [Setup Guide](operational/setup.md) - Local development environment
- [Slack Webhook Setup](operational/slack-webhook-setup.md) - Configure Slack alerts
- [AWS Billing Guide](technical/aws-billing-guide.md) - Cost optimization

### Technical Documentation
- [Architecture](technical/architecture.md) - System design
- [API Reference](reference/api.md) - Database schema and Lambda APIs

### Deployment
- [Deployment Guide](operational/deployment.md) - Production deployment
- [Progress Tracking](progress.md) - Implementation status

### Project Context
- [Project Goals](project-goals.md) - Vision and success criteria
- [Decision Log](decisions.log.md) - Architecture decisions

## Documentation Types

### Technical Documentation
Deep technical details about system design, architecture decisions, and implementation specifics. Includes diagrams, data flow explanations, and technical trade-offs.

### Operational Documentation
Practical guides for setting up, configuring, and deploying the system. Step-by-step instructions for both local development and production environments.

### Reference Documentation
API specifications, database schemas, environment variables, and other reference materials needed during development and troubleshooting.

## Maintenance

- Update `progress.md` when completing milestones
- Add to `decisions.log.md` when making architectural decisions
- Keep operational guides current with setup changes
- Review and update cost estimates in AWS billing guide quarterly
