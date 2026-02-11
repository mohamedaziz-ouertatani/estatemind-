import { User, SubscriptionTier } from '@prisma/client'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * Credit limits by subscription tier
 */
const CREDIT_LIMITS = {
  [SubscriptionTier.FREE]: 3,
  [SubscriptionTier.BASIC_19]: 999999, // Unlimited
  [SubscriptionTier.INVESTOR_149]: 999999, // Unlimited
  [SubscriptionTier.INVESTOR_PRO_299]: 999999, // Unlimited
  [SubscriptionTier.AGENCY_499]: 999999, // Unlimited
}

/**
 * Get valuation credits for a user
 */
export async function getValuationCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, createdAt: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Count valuations this month
  const usage = await prisma.valuation.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(new Date())
      }
    }
  })

  const limit = CREDIT_LIMITS[user.subscriptionTier]
  const isUnlimited = limit === 999999
  const remaining = isUnlimited ? 'Unlimited' : Math.max(0, limit - usage)

  return {
    used: usage,
    remaining,
    limit: isUnlimited ? 'Unlimited' : limit,
    resetDate: endOfMonth(new Date()),
    tier: user.subscriptionTier,
  }
}

/**
 * Check if user has valuation credits
 */
export async function hasValuationCredits(userId: string): Promise<boolean> {
  const credits = await getValuationCredits(userId)
  return credits.remaining === 'Unlimited' || (typeof credits.remaining === 'number' && credits.remaining > 0)
}

/**
 * Deduct a valuation credit (tracked by creating valuation record)
 */
export async function deductValuationCredit(userId: string) {
  // Credits are automatically tracked by creating valuation records
  // This function is here for additional logic if needed in the future
  const credits = await getValuationCredits(userId)
  
  if (credits.remaining !== 'Unlimited' && typeof credits.remaining === 'number' && credits.remaining <= 0) {
    throw new Error('No valuation credits remaining')
  }
  
  return true
}

/**
 * Get credit usage statistics
 */
export async function getCreditUsageStats(userId: string) {
  const currentMonth = await prisma.valuation.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(new Date())
      }
    }
  })

  const lastMonth = await prisma.valuation.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))),
        lt: startOfMonth(new Date())
      }
    }
  })

  const allTime = await prisma.valuation.count({
    where: { userId }
  })

  return {
    currentMonth,
    lastMonth,
    allTime,
  }
}
