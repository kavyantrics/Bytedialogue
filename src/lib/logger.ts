import pino from 'pino'

// Create logger instance
// Disable pretty transport in API routes/server-side to avoid worker thread issues with Next.js/Turbopack
// pino-pretty uses worker threads which don't work well in Next.js API routes
const isServerSide = typeof window === 'undefined'
const shouldUsePretty = process.env.NODE_ENV === 'development' && !isServerSide

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(shouldUsePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  base: {
    env: process.env.NODE_ENV,
  },
})

// Export logger functions
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => logger.info(meta, message),
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error({ ...meta, err: error, stack: error.stack }, message)
    } else {
      logger.error(meta, message)
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(meta, message),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(meta, message),
}

export default logger

