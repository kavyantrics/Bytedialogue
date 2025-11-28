import { Registry, Counter, Histogram, Gauge } from 'prom-client'

// Create a registry for Prometheus metrics
export const register = new Registry()

// Define metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  registers: [register],
})

export const pdfUploadsTotal = new Counter({
  name: 'pdf_uploads_total',
  help: 'Total number of PDF uploads',
  labelNames: ['status'],
  registers: [register],
})

export const aiOperationsTotal = new Counter({
  name: 'ai_operations_total',
  help: 'Total number of AI operations',
  labelNames: ['operation_type', 'model'],
  registers: [register],
})

export const aiTokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['operation_type', 'model'],
  registers: [register],
})

export const aiCostTotal = new Counter({
  name: 'ai_cost_total',
  help: 'Total cost of AI operations in USD',
  labelNames: ['operation_type', 'model'],
  registers: [register],
})

// Export metrics endpoint handler
export async function getMetrics() {
  return await register.metrics()
}

