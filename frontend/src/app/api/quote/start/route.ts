/**
 * Start Quote Route Handler
 * POST /api/quote/start
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Conversation, QuoteStartResponse } from '@/types'
import { generateConversationId, getClientIP } from '@/lib/utils/helpers'
import { saveConversation } from '@/lib/utils/storage'
import { checkRateLimit, incrementQuoteCount } from '@/lib/services/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request.headers)

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(ip)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
        },
        { status: 429 }
      )
    }

    // Generate conversation ID
    const conversationId = generateConversationId()

    // Create new conversation
    const conversation: Conversation = {
      id: conversationId,
      ip,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messages: [
        {
          role: 'assistant',
          content:
            "Hi! I'm here to help you get a quote for your 3D printing project. What would you like to print?",
          timestamp: Date.now(),
        },
      ],
      quoteDetails: {},
      status: 'active',
      messageCount: 0,
    }

    // Save conversation
    await saveConversation(conversation)

    // Increment quote count
    await incrementQuoteCount(ip, conversationId)

    const response: QuoteStartResponse = {
      conversationId,
      message: conversation.messages[0].content,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error starting quote:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start quote conversation',
      },
      { status: 500 }
    )
  }
}
