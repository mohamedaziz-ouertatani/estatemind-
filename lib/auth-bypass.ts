/**
 * Development Authentication Bypass
 * 
 * This module provides a smart bypass for authentication during development.
 * It automatically creates a mock investor user with full access to all features.
 * 
 * IMPORTANT: This bypass only works when:
 * - NODE_ENV is set to 'development'
 * - NEXT_PUBLIC_BYPASS_AUTH is set to 'true'
 */

import { UserType, SubscriptionTier } from '@prisma/client'

export const DEV_BYPASS_ENABLED = 
  process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

export const MOCK_DEV_USER = {
  id: 'dev-bypass-user-id',
  email: 'dev@estatemind.tn',
  name: 'Dev User (Bypass Mode)',
  userType: UserType.INVESTOR,
  subscriptionTier: SubscriptionTier.INVESTOR_PRO_299,
  valuationCredits: 999999,
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * Get the current user, or return mock dev user if bypass is enabled
 */
export async function getCurrentUserWithBypass() {
  if (DEV_BYPASS_ENABLED) {
    return MOCK_DEV_USER
  }
  
  // TODO: Implement actual auth check with NextAuth
  // For now, return null if not in bypass mode
  return null
}

/**
 * Check if user has valuation credits
 */
export function hasValuationCredits(user: typeof MOCK_DEV_USER): boolean {
  // Unlimited credits for certain tiers
  if ([
    SubscriptionTier.INVESTOR_149,
    SubscriptionTier.INVESTOR_PRO_299,
    SubscriptionTier.AGENCY_499
  ].includes(user.subscriptionTier)) {
    return true
  }
  
  // Check credits for free tier
  return user.valuationCredits > 0
}

/**
 * Check if authentication bypass is active
 */
export function isDevBypassActive(): boolean {
  return DEV_BYPASS_ENABLED
}
