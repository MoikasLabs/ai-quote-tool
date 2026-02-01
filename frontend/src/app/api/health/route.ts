/**
 * Health Check Route Handler
 * GET /api/health
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
  })
}
