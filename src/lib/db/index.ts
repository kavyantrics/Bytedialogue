import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Test the connection
async function testConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database connection test failed:', error)
    throw error
  }
}

// Run the test
testConnection().catch(console.error) 