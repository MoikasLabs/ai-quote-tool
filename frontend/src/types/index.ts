/**
 * Frontend TypeScript types for AI Quote Tool
 * Mirrors backend types for API communication
 */

export interface Message {
  role: 'user' | 'assistant'
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
  printTime: number
  laborCost: number
  rushFee: number
  subtotal: number
  total: number
  breakdown: {
    materialType: string
    materialWeight: number
    pricePerKg: number
    printTimeHours: number
    laborMarkup: number
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

export interface QuoteMessageResponse {
  message: string
  quoteDetails?: QuoteDetails
  quoteCalculation?: QuoteCalculation
  conversationComplete?: boolean
}

export interface RateLimitStatus {
  quotesUsed: number
  quotesRemaining: number
  quotesLimit: number
  resetAt: number
  currentConversation?: {
    messageCount: number
    maxMessages: number
  }
}
