#!/usr/bin/env tsx
/**
 * Script to promote a user to admin
 * 
 * Usage:
 *   npx tsx scripts/make-admin.ts <user-email>
 *   or
 *   npx tsx scripts/make-admin.ts <user-id>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(identifier: string) {
  try {
    // Try to find user by email or ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { id: identifier },
          { kindeId: identifier },
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      console.error(`❌ User not found: ${identifier}`)
      console.log('\n💡 Make sure the user has logged in at least once to be created in the database.')
      process.exit(1)
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ User ${user.email || user.id} is already an admin`)
      return
    }

    // Update user to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })

    console.log(`✅ Successfully promoted ${user.email || user.id} to ADMIN`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get identifier from command line
const identifier = process.argv[2]

if (!identifier) {
  console.error('❌ Please provide a user email or ID')
  console.log('\nUsage:')
  console.log('  npx tsx scripts/make-admin.ts <user-email>')
  console.log('  npx tsx scripts/make-admin.ts <user-id>')
  process.exit(1)
}

makeAdmin(identifier)

