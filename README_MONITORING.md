# Monitoring & Analytics Setup Guide

This guide explains how to set up monitoring, analytics, and logging for ByteDialogue.

## 📊 Analytics Dashboard

The analytics dashboard is available in the admin panel at `/admin` (Analytics Dashboard tab). It includes:

- **Active Users**: Users with activity in the last 30 days
- **PDF Upload Trends**: Line chart showing uploads over the last 14 days
- **Token Usage by Plan**: Pie and bar charts showing token distribution
- **Revenue Metrics**: MRR, ARR, and active subscriptions

### Features:
- Real-time data visualization using Recharts
- Interactive charts with tooltips
- Plan-based token usage breakdown
- Revenue tracking

## 🔍 Sentry Error Tracking

Sentry is integrated for production error tracking.

### Setup:

1. Create a Sentry account at https://sentry.io
2. Create a new project and get your DSN
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   SENTRY_ORG=your_org_slug
   SENTRY_PROJECT=your_project_slug
   ```
4. Run `npm run build` to upload source maps

### Features:
- Automatic error capture
- Source map support
- Performance monitoring
- User session replay (in production)

## 📈 Prometheus Metrics

Prometheus metrics are exposed at `/api/metrics`.

### Available Metrics:

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: HTTP request duration
- `active_users_total`: Number of active users
- `pdf_uploads_total`: PDF uploads by status
- `ai_operations_total`: AI operations by type
- `ai_tokens_used_total`: Total tokens used
- `ai_cost_total`: Total AI costs

### Setup Prometheus:

1. Use the provided `docker-compose.monitoring.yml`:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. Prometheus will be available at http://localhost:9090

3. Configure Prometheus to scrape `/api/metrics` endpoint

## 📊 Grafana Dashboards

Grafana dashboards are pre-configured in `grafana/dashboards/`.

### Setup:

1. Start Grafana with the monitoring stack:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. Access Grafana at http://localhost:3001
   - Username: `admin`
   - Password: `admin`

3. The ByteDialogue dashboard will be automatically provisioned

### Dashboard Panels:

- HTTP Request Rate
- HTTP Request Duration (p95)
- Active Users
- PDF Uploads
- AI Operations
- AI Tokens Used
- AI Cost

## 📝 Structured Logging

Structured logging is implemented using Pino.

### Usage:

```typescript
import { log } from '@/lib/logger'

// Info log
log.info('User logged in', { userId: user.id })

// Error log
log.error('Failed to process file', error, { fileId })

// Warn log
log.warn('Rate limit approaching', { userId, usage })

// Debug log (only in development)
log.debug('Processing request', { method, url })
```

### Configuration:

Set `LOG_LEVEL` in `.env.local`:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: Info, warnings, and errors (default)
- `debug`: All logs (development only)

### Features:

- Pretty printing in development
- JSON output in production
- Automatic timestamp and environment tagging
- Error stack traces

## 🚀 Quick Start

1. **Analytics Dashboard**: Already available at `/admin` → Analytics Dashboard tab

2. **Sentry**: Add DSN to `.env.local` and rebuild

3. **Prometheus + Grafana**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

4. **Logging**: Use `log.info()`, `log.error()`, etc. throughout the codebase

## 📚 Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Pino Documentation](https://getpino.io/)

