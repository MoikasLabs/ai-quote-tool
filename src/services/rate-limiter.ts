/**
 * Rate Limiting Service
 * Free tier: 50 quotes per month per IP
 * Future: Pro ($79/mo): 2000 quotes/month
 * Future: Enterprise ($199/mo): Unlimited
 */

import { RateLimit } from '../types'
import { loadRateLimit, saveRateLimit } from '../utils/storage'

const RATE_LIMITS = {
  free: {
    quotesPerMonth: 50,
    messagesPerConversation: 30, // Max messages in a single conversation
  },
  pro: {
    quotesPerMonth: 2000,
    messagesPerConversation: 100,
  },
  enterprise: {
    quotesPerMonth: Infinity,
    messagesPerConversation: 200,
  },
}

const RESET_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Check if IP is allowed to start a new quote
 */
export async function checkRateLimit(
  ip: string,
  tier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{
  allowed: boolean
  reason?: string
  limit?: RateLimit
}> {
  const now = Date.now()
  let limit = await loadRateLimit(ip)

  // Initialize or reset if expired
  if (!limit || now > limit.resetAt) {
    limit = {
      quotesUsed: 0,
      quotesLimit: RATE_LIMITS[tier].quotesPerMonth,
      resetAt: now + RESET_WINDOW_MS,
    }
    await saveRateLimit(ip, limit)
  }

  // Check if limit exceeded
  if (limit.quotesUsed >= limit.quotesLimit) {
    const resetDate = new Date(limit.resetAt).toLocaleDateString()
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit.quotesLimit} quotes. Limit resets on ${resetDate}. Upgrade to Pro for 2,000 quotes/month!`,
      limit,
    }
  }

  return {
    allowed: true,
    limit,
  }
}

/**
 * Increment quote count for IP
 */
export async function incrementQuoteCount(
  ip: string,
  conversationId: string
): Promise<void> {
  const limit = await loadRateLimit(ip)

  if (limit) {
    limit.quotesUsed++
    limit.currentConversation = {
      id: conversationId,
      messageCount: 0,
    }
    await saveRateLimit(ip, limit)
  }
}

/**
 * Check if conversation has exceeded message limit
 */
export async function checkMessageLimit(
  ip: string,
  conversationId: string,
  tier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{
  allowed: boolean
  reason?: string
}> {
  const limit = await loadRateLimit(ip)

  if (
    !limit ||
    !limit.currentConversation ||
    limit.currentConversation.id !== conversationId
  ) {
    return { allowed: true }
  }

  const maxMessages = RATE_LIMITS[tier].messagesPerConversation

  if (limit.currentConversation.messageCount >= maxMessages) {
    return {
      allowed: false,
      reason: `This conversation has reached the maximum of ${maxMessages} messages. Please start a new quote conversation.`,
    }
  }

  return { allowed: true }
}

/**
 * Increment message count for current conversation
 */
export async function incrementMessageCount(ip: string): Promise<void> {
  const limit = await loadRateLimit(ip)

  if (limit && limit.currentConversation) {
    limit.currentConversation.messageCount++
    await saveRateLimit(ip, limit)
  }
}

/**
 * End current conversation (clear currentConversation)
 */
export async function endCurrentConversation(ip: string): Promise<void> {
  const limit = await loadRateLimit(ip)

  if (limit) {
    limit.currentConversation = undefined
    await saveRateLimit(ip, limit)
  }
}

/**
 * Get rate limit status for display
 */
export async function getRateLimitStatus(ip: string): Promise<{
  quotesUsed: number
  quotesRemaining: number
  quotesLimit: number
  resetAt: number
  currentConversation?: {
    messageCount: number
    maxMessages: number
  }
}> {
  const limit = await loadRateLimit(ip)

  if (!limit) {
    return {
      quotesUsed: 0,
      quotesRemaining: RATE_LIMITS.free.quotesPerMonth,
      quotesLimit: RATE_LIMITS.free.quotesPerMonth,
      resetAt: Date.now() + RESET_WINDOW_MS,
    }
  }

  const status = {
    quotesUsed: limit.quotesUsed,
    quotesRemaining: Math.max(0, limit.quotesLimit - limit.quotesUsed),
    quotesLimit: limit.quotesLimit,
    resetAt: limit.resetAt,
  }

  if (limit.currentConversation) {
    return {
      ...status,
      currentConversation: {
        messageCount: limit.currentConversation.messageCount,
        maxMessages: RATE_LIMITS.free.messagesPerConversation,
      },
    }
  }

  return status
}
