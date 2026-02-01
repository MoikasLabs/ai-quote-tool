/**
 * Retrieve Quote Route Handler
 * GET /api/quote/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import type { QuoteRetrieveResponse } from '@/types'
import { getClientIP, isValidConversationId } from '@/lib/utils/helpers'
import { loadConversation } from '@/lib/utils/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const ip = getClientIP(request.headers)

    // Validate ID
    if (!isValidConversationId(conversationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid conversation ID',
        },
        { status: 400 }
      )
    }

    // Load conversation
    const conversation = await loadConversation(conversationId)
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conversation not found',
        },
        { status: 404 }
      )
    }

    // Verify IP matches
    if (conversation.ip !== ip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      )
    }

    const response: QuoteRetrieveResponse = {
      conversation,
      quote: conversation.quoteCalculation,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error retrieving quote:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve quote',
      },
      { status: 500 }
    )
  }
}
