# Config Drift Detector - Frontend

Next.js dashboard for visualizing AWS configuration drift events.

## Features

- Real-time drift event monitoring
- Summary cards with severity breakdown
- Filterable drift table
- Baseline configuration viewer
- Auto-refresh (5s polling)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Pages

- `/` - Dashboard with summary cards and recent drifts
- `/drifts` - Full drift table with filters
- `/baselines` - Baseline configuration viewer

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

Deployed to Vercel:

```bash
vercel --prod
```
