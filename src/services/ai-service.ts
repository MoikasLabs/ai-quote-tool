/**
 * OpenClaw AI Integration Service
 * Handles all communication with the AI API
 */

import { Message, OpenClawRequest, OpenClawResponse, QuoteDetails } from '../types'
import { parseDimensions } from '../utils/helpers'

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'https://api.moikas.com/v1'
const OPENCLAW_MODEL = process.env.OPENCLAW_MODEL || 'anthropic/claude-sonnet-4-5-20250929'
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || ''

// System prompt that guides the AI's behavior
const SYSTEM_PROMPT = `You are a professional 3D printing quote assistant for Moikas 3D Printing Service.

YOUR ROLE:
- Help customers get accurate quote estimates for 3D printing projects
- Ask clarifying questions to gather all necessary information
- Provide friendly, professional service
- Guide customers through the quoting process

STRICT RULES:
1. ONLY discuss 3D printing quotes, services, materials, and costs
2. If asked about anything unrelated (weather, news, coding, homework, etc.), respond:
   "I can only help with 3D printing quotes. What would you like to print?"
3. NEVER discuss topics outside of 3D printing

INFORMATION TO COLLECT (in order):
1. What object/item they want to print
2. Dimensions/size (ask for specific measurements in inches or cm)
3. Material preference:
   - PLA: Best for decorative items, easiest to print ($20/kg)
   - PETG: Stronger, more durable, heat resistant ($25/kg)
   - TPU: Flexible, rubber-like material ($35/kg)
   - ABS: Strong, heat resistant, requires special handling ($22/kg)
4. Quantity (how many copies)
5. Color preference (standard colors included, custom colors +$20)
6. Finish requirements (standard, smooth sanded, or painted)
7. Timing (rush orders available for +50% fee)

PRICING GUIDANCE:
- Material cost: Based on weight (estimated from dimensions)
- Labor: 1.5x material cost
- Discovery Fee: $10 (one-time setup)
- Custom color: +$20
- Smooth finish: +$15
- Painted finish: +$30
- Rush order: +50% of subtotal

YOUR CONVERSATION STYLE:
- Be friendly and conversational
- Ask one main question at a time
- Provide helpful context when asking about materials
- When you have enough info (object, size, material), indicate you're ready to calculate
- Use natural language, avoid sounding robotic
- Suggest appropriate materials based on their use case

IMPORTANT:
- After collecting object, dimensions, and material, say you're calculating the quote
- The system will automatically generate the detailed quote breakdown
- Then ask if they need any other quotes or have questions

Remember: Stay focused on 3D printing only. Politely redirect off-topic questions.`

/**
 * Call OpenClaw API to get AI response
 */
export async function getAIResponse(
  messages: Message[],
  quoteDetails?: QuoteDetails
): Promise<string> {
  try {
    // Add context about current quote details if available
    let systemPrompt = SYSTEM_PROMPT

    if (quoteDetails) {
      const context: string[] = []
      if (quoteDetails.object) context.push(`Object: ${quoteDetails.object}`)
      if (quoteDetails.dimensions) {
        const d = quoteDetails.dimensions
        context.push(
          `Size: ${d.length || '?'}x${d.width || '?'}x${d.height || '?'} ${d.unit || ''}`
        )
      }
      if (quoteDetails.material) context.push(`Material: ${quoteDetails.material}`)
      if (quoteDetails.quantity) context.push(`Quantity: ${quoteDetails.quantity}`)

      if (context.length > 0) {
        systemPrompt += `\n\nCURRENT QUOTE INFO:\n${context.join('\n')}`
      }
    }

    const requestBody: OpenClawRequest = {
      model: OPENCLAW_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }

    const response = await fetch(`${OPENCLAW_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENCLAW_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenClaw API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data: OpenClawResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('Error calling OpenClaw API:', error)

    // Fallback response if API fails
    return "I'm having trouble connecting to my AI service right now. Please try again in a moment, or email hello@moikas.com for direct assistance."
  }
}

/**
 * Extract quote details from conversation
 * Uses simple pattern matching (AI could help with this too)
 */
export function extractQuoteDetails(
  messages: Message[],
  currentDetails: QuoteDetails
): QuoteDetails {
  const updated = { ...currentDetails }

  // Get the last user message
  const lastUserMessage = messages
    .filter((m) => m.role === 'user')
    .pop()

  if (!lastUserMessage) return updated

  const text = lastUserMessage.content.toLowerCase()

  // Extract object name (first message usually)
  if (!updated.object && messages.filter((m) => m.role === 'user').length === 1) {
    updated.object = lastUserMessage.content.slice(0, 100) // First 100 chars
  }

  // Extract dimensions
  const dimensions = parseDimensions(text)
  if (dimensions) {
    updated.dimensions = { ...updated.dimensions, ...dimensions }
  }

  // Extract material
  if (text.includes('pla') && !text.includes('petg')) {
    updated.material = 'PLA'
  } else if (text.includes('petg')) {
    updated.material = 'PETG'
  } else if (text.includes('tpu') || text.includes('flexible')) {
    updated.material = 'TPU'
  } else if (text.includes('abs')) {
    updated.material = 'ABS'
  }

  // Infer material from use case
  if (!updated.material) {
    if (text.includes('strong') || text.includes('durable') || text.includes('functional')) {
      updated.material = 'PETG'
    } else if (text.includes('decorative') || text.includes('display')) {
      updated.material = 'PLA'
    }
  }

  // Extract quantity
  const quantityMatch = text.match(/(\d+)\s*(copies|pieces|units|prints)/i)
  if (quantityMatch) {
    updated.quantity = parseInt(quantityMatch[1], 10)
  } else if (text.match(/\b(\d+)\b/) && !updated.quantity) {
    // If a standalone number is mentioned and we don't have quantity yet
    const num = parseInt(text.match(/\b(\d+)\b/)![1], 10)
    if (num > 0 && num < 100) {
      updated.quantity = num
    }
  }

  // Default quantity to 1 if not specified
  if (!updated.quantity) {
    updated.quantity = 1
  }

  // Extract color preference
  if (text.includes('color')) {
    if (text.includes('custom') || text.includes('specific')) {
      updated.color = 'custom'
    } else {
      updated.color = 'standard'
    }
  }

  // Extract finish
  if (text.includes('smooth') || text.includes('sand')) {
    updated.finish = 'smooth'
  } else if (text.includes('paint')) {
    updated.finish = 'painted'
  } else if (text.includes('standard') || text.includes('normal')) {
    updated.finish = 'standard'
  }

  // Rush order
  if (text.includes('rush') || text.includes('urgent') || text.includes('asap')) {
    updated.rushOrder = true
  }

  return updated
}

/**
 * Check if message is off-topic
 */
export function isOffTopic(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  const offTopicKeywords = [
    'weather',
    'news',
    'politics',
    'poem',
    'story',
    'joke',
    'song',
    'recipe',
    'homework',
    'essay',
  ]

  return offTopicKeywords.some((keyword) => lowerMessage.includes(keyword))
}
