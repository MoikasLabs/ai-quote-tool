/**
 * Send Message Route Handler
 * POST /api/quote/message
 */

import { NextRequest, NextResponse } from 'next/server'
import type { QuoteMessageRequest, QuoteMessageResponse } from '@/types'
import { sanitizeInput, getClientIP, isValidConversationId } from '@/lib/utils/helpers'
import { saveConversation, loadConversation } from '@/lib/utils/storage'
import {
  checkMessageLimit,
  incrementMessageCount,
} from '@/lib/services/rate-limiter'
import { getAIResponse, extractQuoteDetails } from '@/lib/services/ai-service'
import {
  calculateQuote,
  formatQuoteBreakdown,
  canGenerateQuote,
} from '@/lib/services/quote-calculator'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request.headers)
    const body = (await request.json()) as QuoteMessageRequest

    // Validate request
    if (!body.conversationId || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing conversationId or message',
        },
        { status: 400 }
      )
    }

    if (!isValidConversationId(body.conversationId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid conversation ID',
        },
        { status: 400 }
      )
    }

    // Sanitize user input
    const userMessage = sanitizeInput(body.message)
    if (!userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message cannot be empty',
        },
        { status: 400 }
      )
    }

    // Load conversation
    const conversation = await loadConversation(body.conversationId)
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conversation not found',
        },
        { status: 404 }
      )
    }

    // Verify IP matches (prevent conversation hijacking)
    if (conversation.ip !== ip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      )
    }

    // Check message limit
    const messageLimitCheck = await checkMessageLimit(ip, body.conversationId)
    if (!messageLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: messageLimitCheck.reason,
        },
        { status: 429 }
      )
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    })
    conversation.messageCount++
    conversation.lastMessageAt = Date.now()

    // Extract quote details from user message
    conversation.quoteDetails = extractQuoteDetails(
      conversation.messages,
      conversation.quoteDetails
    )

    // Check if we can generate a quote
    let quoteCalculation = null
    let conversationComplete = false

    if (canGenerateQuote(conversation.quoteDetails)) {
      quoteCalculation = calculateQuote(conversation.quoteDetails)
      if (quoteCalculation) {
        conversation.quoteCalculation = quoteCalculation
        conversation.status = 'quoted'
        conversationComplete = true
      }
    }

    // Get AI response
    const aiResponse = await getAIResponse(
      conversation.messages,
      conversation.quoteDetails
    )

    // If we generated a quote, append the breakdown to AI response
    let finalResponse = aiResponse
    if (quoteCalculation && conversationComplete) {
      finalResponse = `${aiResponse}\n\n${formatQuoteBreakdown(
        quoteCalculation,
        conversation.quoteDetails
      )}`
    }

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: finalResponse,
      timestamp: Date.now(),
    })

    // Save updated conversation
    await saveConversation(conversation)

    // Increment message count in rate limiter
    await incrementMessageCount(ip)

    const response: QuoteMessageResponse = {
      message: finalResponse,
      quoteDetails: conversation.quoteDetails,
      quoteCalculation: quoteCalculation || undefined,
      conversationComplete,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process message',
      },
      { status: 500 }
    )
  }
}
