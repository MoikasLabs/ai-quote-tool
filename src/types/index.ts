/**
 * Core TypeScript types for the AI Quote Tool
 */

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

export interface QuoteDetails {
  object?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: 'inches' | 'cm' | 'mm'
  }
  material?: 'PLA' | 'PETG' | 'TPU' | 'ABS'
  quantity?: number
  color?: string
  finish?: 'standard' | 'smooth' | 'painted'
  rushOrder?: boolean
  specialRequirements?: string
}

export interface QuoteCalculation {
  materialCost: number
  printTime: number // in hours
  laborCost: number
  rushFee: number
  subtotal: number
  total: number
  breakdown: {
    materialType: string
    materialWeight: number // estimated grams
    pricePerKg: number
    printTimeHours: number
    laborMarkup: number
  }
}

export interface Conversation {
  id: string
  ip: string
  startedAt: number
  lastMessageAt: number
  messages: Message[]
  quoteDetails: QuoteDetails
  quoteCalculation?: QuoteCalculation
  status: 'active' | 'quoted' | 'abandoned'
  messageCount: number
}

export interface RateLimit {
  quotesUsed: number
  quotesLimit: number
  resetAt: number
  currentConversation?: {
    id: string
    messageCount: number
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface QuoteStartResponse {
  conversationId: string
  message: string
}

export interface QuoteMessageRequest {
  conversationId: string
  message: string
}

export interface QuoteMessageResponse {
  message: string
  quoteDetails?: QuoteDetails
  quoteCalculation?: QuoteCalculation
  conversationComplete?: boolean
}

export interface QuoteRetrieveResponse {
  conversation: Conversation
  quote?: QuoteCalculation
}

// OpenClaw API types
export interface OpenClawMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OpenClawRequest {
  model: string
  messages: OpenClawMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface OpenClawResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
