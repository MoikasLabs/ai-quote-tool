/**
 * AI 3D Print Quote Calculator API
 * Main server with RESTful endpoints
 */

import { serve } from 'bun'
import type {
  Conversation,
  QuoteStartResponse,
  QuoteMessageRequest,
  QuoteMessageResponse,
  QuoteRetrieveResponse,
} from './types'
import { generateConversationId, sanitizeInput, getClientIP, isValidConversationId } from './utils/helpers'
import { saveConversation, loadConversation } from './utils/storage'
import {
  checkRateLimit,
  incrementQuoteCount,
  checkMessageLimit,
  incrementMessageCount,
  getRateLimitStatus,
} from './services/rate-limiter'
import { getAIResponse, extractQuoteDetails } from './services/ai-service'
import { calculateQuote, formatQuoteBreakdown, canGenerateQuote } from './services/quote-calculator'

const PORT = parseInt(process.env.PORT || '3002', 10)
const CORS_ORIGINS = process.env.CORS_ORIGINS || '*'

/**
 * CORS headers
 */
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGINS,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * Handle OPTIONS requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  })
}

/**
 * JSON response helper
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
  })
}

/**
 * POST /api/quote/start
 * Start a new quote conversation
 */
async function handleQuoteStart(req: Request): Promise<Response> {
  try {
    const ip = getClientIP(req.headers)

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(ip)
    if (!rateLimitCheck.allowed) {
      return jsonResponse(
        {
          success: false,
          error: rateLimitCheck.reason,
        },
        429
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

    return jsonResponse({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error starting quote:', error)
    return jsonResponse(
      {
        success: false,
        error: 'Failed to start quote conversation',
      },
      500
    )
  }
}

/**
 * POST /api/quote/message
 * Send a message in an existing conversation
 */
async function handleQuoteMessage(req: Request): Promise<Response> {
  try {
    const ip = getClientIP(req.headers)
    const body = (await req.json()) as QuoteMessageRequest

    // Validate request
    if (!body.conversationId || !body.message) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing conversationId or message',
        },
        400
      )
    }

    if (!isValidConversationId(body.conversationId)) {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid conversation ID',
        },
        400
      )
    }

    // Sanitize user input
    const userMessage = sanitizeInput(body.message)
    if (!userMessage) {
      return jsonResponse(
        {
          success: false,
          error: 'Message cannot be empty',
        },
        400
      )
    }

    // Load conversation
    const conversation = await loadConversation(body.conversationId)
    if (!conversation) {
      return jsonResponse(
        {
          success: false,
          error: 'Conversation not found',
        },
        404
      )
    }

    // Verify IP matches (prevent conversation hijacking)
    if (conversation.ip !== ip) {
      return jsonResponse(
        {
          success: false,
          error: 'Unauthorized',
        },
        403
      )
    }

    // Check message limit
    const messageLimitCheck = await checkMessageLimit(ip, body.conversationId)
    if (!messageLimitCheck.allowed) {
      return jsonResponse(
        {
          success: false,
          error: messageLimitCheck.reason,
        },
        429
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

    return jsonResponse({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return jsonResponse(
      {
        success: false,
        error: 'Failed to process message',
      },
      500
    )
  }
}

/**
 * GET /api/quote/:id
 * Retrieve a quote conversation by ID
 */
async function handleQuoteRetrieve(conversationId: string, req: Request): Promise<Response> {
  try {
    const ip = getClientIP(req.headers)

    // Validate ID
    if (!isValidConversationId(conversationId)) {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid conversation ID',
        },
        400
      )
    }

    // Load conversation
    const conversation = await loadConversation(conversationId)
    if (!conversation) {
      return jsonResponse(
        {
          success: false,
          error: 'Conversation not found',
        },
        404
      )
    }

    // Verify IP matches
    if (conversation.ip !== ip) {
      return jsonResponse(
        {
          success: false,
          error: 'Unauthorized',
        },
        403
      )
    }

    const response: QuoteRetrieveResponse = {
      conversation,
      quote: conversation.quoteCalculation,
    }

    return jsonResponse({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error retrieving quote:', error)
    return jsonResponse(
      {
        success: false,
        error: 'Failed to retrieve quote',
      },
      500
    )
  }
}

/**
 * GET /api/rate-limit-status
 * Get current rate limit status
 */
async function handleRateLimitStatus(req: Request): Promise<Response> {
  try {
    const ip = getClientIP(req.headers)
    const status = await getRateLimitStatus(ip)

    return jsonResponse({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return jsonResponse(
      {
        success: false,
        error: 'Failed to get rate limit status',
      },
      500
    )
  }
}

/**
 * Main request handler
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // Handle OPTIONS
  if (method === 'OPTIONS') {
    return handleOptions()
  }

  // Health check
  if (path === '/health' || path === '/api/health') {
    return jsonResponse({ status: 'ok', timestamp: Date.now() })
  }

  // API routes
  if (path === '/api/quote/start' && method === 'POST') {
    return handleQuoteStart(req)
  }

  if (path === '/api/quote/message' && method === 'POST') {
    return handleQuoteMessage(req)
  }

  if (path.startsWith('/api/quote/') && method === 'GET') {
    const conversationId = path.split('/api/quote/')[1]
    return handleQuoteRetrieve(conversationId, req)
  }

  if (path === '/api/rate-limit-status' && method === 'GET') {
    return handleRateLimitStatus(req)
  }

  // 404
  return jsonResponse(
    {
      success: false,
      error: 'Not found',
    },
    404
  )
}

/**
 * Start server
 */
const server = serve({
  port: PORT,
  fetch: handleRequest,
})

console.log(`🖨️  AI Quote Tool API running on http://localhost:${server.port}`)
console.log(`📡 Endpoints:`)
console.log(`   POST   /api/quote/start`)
console.log(`   POST   /api/quote/message`)
console.log(`   GET    /api/quote/:id`)
console.log(`   GET    /api/rate-limit-status`)
console.log(`   GET    /health`)
