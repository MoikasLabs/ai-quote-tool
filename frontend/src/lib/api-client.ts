/**
 * API Client for communicating with the backend
 */

import type {
  APIResponse,
  QuoteStartResponse,
  QuoteMessageResponse,
  RateLimitStatus,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

/**
 * Start a new quote conversation
 */
export async function startQuote(): Promise<QuoteStartResponse> {
  const response = await fetch(`${API_URL}/api/quote/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data: APIResponse<QuoteStartResponse> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to start quote')
  }

  return data.data
}

/**
 * Send a message in an existing conversation
 */
export async function sendMessage(
  conversationId: string,
  message: string
): Promise<QuoteMessageResponse> {
  const response = await fetch(`${API_URL}/api/quote/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId,
      message,
    }),
  })

  const data: APIResponse<QuoteMessageResponse> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to send message')
  }

  return data.data
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(): Promise<RateLimitStatus> {
  const response = await fetch(`${API_URL}/api/rate-limit-status`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data: APIResponse<RateLimitStatus> = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to get rate limit status')
  }

  return data.data
}
