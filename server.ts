/**
 * AI 3D Print Quote Tool - Backend
 * IP-based rate limiting, no login required
 */

import { serve } from 'bun'

// Simple in-memory rate limiting (use Redis in production)
const rateLimits = new Map<string, {
  conversations: number,
  lastReset: number,
  currentConvo: { messages: number, started: number } | null
}>()

const LIMITS = {
  conversationsPerHour: 5,
  messagesPerConversation: 20,
  resetWindowMs: 60 * 60 * 1000, // 1 hour
}

const SYSTEM_PROMPT = `You are a 3D printing quote assistant for Moikas 3D Printing Service.

YOUR ONLY JOB: Help estimate print costs and collect project details.

STRICT RULES:
- ONLY answer questions about 3D printing quotes, costs, materials, and services
- If asked ANYTHING else (weather, news, coding, general questions), respond EXACTLY:
  "I can only help with 3D printing quotes. What would you like to print?"
- If user persists off-topic 3 times, respond:
  "For general questions, please email hello@moikas.com. I'm here only for print quotes."
- Never discuss: politics, news, weather, coding help, homework, etc.

YOUR PROCESS:
1. Ask what they want to print
2. Get size/dimensions
3. Ask about material needs (strength vs appearance)
4. Calculate estimate based on:
   - PLA: $0.20/gram
   - PETG: $0.25/gram
   - Technical Discovery Fee: $10
   - Custom color: +$20
   - Multi-color: +$10
5. Provide estimate range
6. Direct to quote form: "Ready for official quote? Upload your file at moikas.com/products/quote"

STAY FOCUSED. NO OFF-TOPIC RESPONSES.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Check and update rate limits
function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now()
  let limit = rateLimits.get(ip)

  // Reset if window expired
  if (!limit || now - limit.lastReset > LIMITS.resetWindowMs) {
    limit = {
      conversations: 0,
      lastReset: now,
      currentConvo: null
    }
    rateLimits.set(ip, limit)
  }

  // Check conversation limit
  if (!limit.currentConvo && limit.conversations >= LIMITS.conversationsPerHour) {
    return {
      allowed: false,
      reason: `You've reached the limit of ${LIMITS.conversationsPerHour} conversations per hour. Please try again later or email hello@moikas.com`
    }
  }

  // Check message limit in current conversation
  if (limit.currentConvo && limit.currentConvo.messages >= LIMITS.messagesPerConversation) {
    return {
      allowed: false,
      reason: `Conversation limit reached (${LIMITS.messagesPerConversation} messages). Please start a new conversation or email hello@moikas.com for assistance.`
    }
  }

  return { allowed: true }
}

// Update rate limit counters
function updateRateLimit(ip: string, isNewConvo: boolean) {
  const limit = rateLimits.get(ip)!
  
  if (isNewConvo) {
    limit.conversations++
    limit.currentConvo = {
      messages: 1,
      started: Date.now()
    }
  } else if (limit.currentConvo) {
    limit.currentConvo.messages++
  }
}

// End current conversation
function endConversation(ip: string) {
  const limit = rateLimits.get(ip)
  if (limit) {
    limit.currentConvo = null
  }
}

// Simple AI call (replace with actual OpenClaw API)
async function getAIResponse(messages: Message[]): Promise<string> {
  // TODO: Replace with actual OpenClaw API call
  // For now, mock response
  const userMessage = messages[messages.length - 1].content.toLowerCase()
  
  // Check for off-topic
  const offTopicKeywords = ['weather', 'news', 'politics', 'poem', 'story', 'homework', 'code']
  if (offTopicKeywords.some(kw => userMessage.includes(kw))) {
    return "I can only help with 3D printing quotes. What would you like to print?"
  }
  
  // Mock conversation flow
  if (messages.length === 1) {
    return "Hi! I can help estimate your 3D printing cost. What would you like to print?"
  }
  
  if (userMessage.includes('dragon') || userMessage.includes('figurine')) {
    return "Great choice! How big should the dragon be? (Please provide dimensions in inches or centimeters)"
  }
  
  if (userMessage.match(/\d+\s*(inch|cm|"/)) {
    return "Perfect! Do you need it to be strong and functional (PETG), or is this more decorative (PLA)?"
  }
  
  if (userMessage.includes('pla') || userMessage.includes('petg') || userMessage.includes('strong') || userMessage.includes('decorative')) {
    return `Based on your requirements, here's an estimate:

**Estimated Cost:**
- Material: ~$15-25
- Technical Discovery Fee: $10
- **Total: $25-35 + shipping**

Ready for an official quote? Upload your STL file at: https://moikas.com/products/moikas-3d-printing-service-request-a-quote

I can answer more questions, or you can start your order now!`
  }
  
  return "I'd be happy to help! Can you tell me more about what you'd like to print?"
}

// Main server
const server = serve({
  port: 3002,
  async fetch(req) {
    const url = new URL(req.url)
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' }, { headers: corsHeaders })
    }
    
    // Chat endpoint
    if (url.pathname === '/chat' && req.method === 'POST') {
      // Get IP (handle proxies)
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      
      const body = await req.json() as {
        messages: Message[]
        isNewConvo?: boolean
      }
      
      // Check rate limit
      const rateCheck = checkRateLimit(ip)
      if (!rateCheck.allowed) {
        return Response.json(
          { error: rateCheck.reason },
          { status: 429, headers: corsHeaders }
        )
      }
      
      // Update counters
      updateRateLimit(ip, body.isNewConvo || false)
      
      // Get AI response
      const aiResponse = await getAIResponse(body.messages)
      
      return Response.json(
        { message: aiResponse },
        { headers: corsHeaders }
      )
    }
    
    // End conversation endpoint
    if (url.pathname === '/end-conversation' && req.method === 'POST') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      
      endConversation(ip)
      
      return Response.json(
        { success: true },
        { headers: corsHeaders }
      )
    }
    
    // Rate limit status
    if (url.pathname === '/rate-limit-status') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      
      const limit = rateLimits.get(ip)
      
      return Response.json({
        conversationsUsed: limit?.conversations || 0,
        conversationsLimit: LIMITS.conversationsPerHour,
        messagesInCurrentConvo: limit?.currentConvo?.messages || 0,
        messagesLimit: LIMITS.messagesPerConversation
      }, { headers: corsHeaders })
    }
    
    return new Response('Not Found', { status: 404 })
  }
})

console.log(`🖨️  AI Quote Tool API running on http://localhost:${server.port}`)
