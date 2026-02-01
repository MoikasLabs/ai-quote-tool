/**
 * Rate Limit Status Route Handler
 * GET /api/rate-limit-status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStatus } from '@/lib/services/rate-limiter'
import { getClientIP } from '@/lib/utils/helpers'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request.headers)
    const status = await getRateLimitStatus(ip)

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get rate limit status',
      },
      { status: 500 }
    )
  }
}
