/**
 * Helper utility functions
 */

import { randomBytes } from 'crypto'

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(6).toString('hex')
  return `conv_${timestamp}_${random}`
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, 2000) // Max length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
}

/**
 * Validate conversation ID format
 */
export function isValidConversationId(id: string): boolean {
  return /^conv_[a-z0-9]+_[a-f0-9]{12}$/.test(id)
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Calculate time until reset (for rate limiting)
 */
export function getTimeUntilReset(resetAt: number): string {
  const now = Date.now()
  const diff = resetAt - now

  if (diff <= 0) return 'now'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Parse dimensions from natural language
 * Examples: "6 inches", "10cm", "5x3x2 inches"
 */
export function parseDimensions(text: string): {
  length?: number
  width?: number
  height?: number
  unit?: 'inches' | 'cm' | 'mm'
} | null {
  const result: any = {}

  // Try to find unit
  if (text.includes('inch') || text.includes('"')) {
    result.unit = 'inches'
  } else if (text.includes('cm')) {
    result.unit = 'cm'
  } else if (text.includes('mm')) {
    result.unit = 'mm'
  }

  // Try to extract numbers
  const numbers = text.match(/\d+\.?\d*/g)
  if (!numbers || numbers.length === 0) return null

  const dims = numbers.map(n => parseFloat(n))

  if (dims.length === 1) {
    result.length = dims[0]
  } else if (dims.length === 2) {
    result.length = dims[0]
    result.width = dims[1]
  } else if (dims.length >= 3) {
    result.length = dims[0]
    result.width = dims[1]
    result.height = dims[2]
  }

  return result
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Estimate print time based on volume
 * Very rough estimation (proper calculation needs 3D model)
 */
export function estimatePrintTime(dimensions: {
  length?: number
  width?: number
  height?: number
  unit?: string
}): number {
  if (!dimensions.length) return 4 // Default 4 hours

  // Convert to cm for consistent calculation
  let size = dimensions.length
  if (dimensions.unit === 'inches') {
    size *= 2.54
  } else if (dimensions.unit === 'mm') {
    size /= 10
  }

  // Rough estimation: 1cm = 0.5 hours, with min 2 hours, max 24 hours
  const hours = Math.max(2, Math.min(24, size * 0.5))
  return Math.round(hours * 10) / 10 // Round to 1 decimal
}

/**
 * Estimate material weight based on dimensions
 * Very rough estimation
 */
export function estimateMaterialWeight(dimensions: {
  length?: number
  width?: number
  height?: number
  unit?: string
}): number {
  if (!dimensions.length) return 50 // Default 50g

  // Convert to cm
  let l = dimensions.length || 5
  let w = dimensions.width || dimensions.length || 5
  let h = dimensions.height || dimensions.length || 5

  if (dimensions.unit === 'inches') {
    l *= 2.54
    w *= 2.54
    h *= 2.54
  } else if (dimensions.unit === 'mm') {
    l /= 10
    w /= 10
    h /= 10
  }

  // Estimate: assume 20% infill, PLA density ~1.24 g/cm³
  const volume = l * w * h
  const weight = volume * 1.24 * 0.2 // 20% infill

  return Math.max(10, Math.min(500, Math.round(weight)))
}
