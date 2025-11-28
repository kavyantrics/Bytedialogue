import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db'

// Check if user's email is verified in Kinde
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user || user.id !== userId) {
      return false
    }

    // Kinde provides email_verified claim
    // Update our database if verified
    if (user.email_verified) {
      await db.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      })
      return true
    }

    return false
  } catch (error) {
    console.error('[KINDE_AUTH] Error checking email verification:', error)
    return false
  }
}

// Check if user has 2FA enabled in Kinde
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user || user.id !== userId) {
      return false
    }

    // Kinde provides mfa_enabled claim
    // Update our database if enabled
    if (user.mfa_enabled) {
      await db.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      })
      return true
    }

    return false
  } catch (error) {
    console.error('[KINDE_AUTH] Error checking 2FA:', error)
    return false
  }
}

// Sync Kinde auth status with database
export async function syncKindeAuthStatus(userId: string): Promise<{
  emailVerified: boolean
  twoFactorEnabled: boolean
}> {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user || user.id !== userId) {
      return { emailVerified: false, twoFactorEnabled: false }
    }

    const emailVerified = Boolean(user.email_verified)
    const twoFactorEnabled = Boolean(user.mfa_enabled)

    // Update database
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified,
        twoFactorEnabled,
      },
    })

    return { emailVerified, twoFactorEnabled }
  } catch (error) {
    console.error('[KINDE_AUTH] Error syncing auth status:', error)
    return { emailVerified: false, twoFactorEnabled: false }
  }
}

