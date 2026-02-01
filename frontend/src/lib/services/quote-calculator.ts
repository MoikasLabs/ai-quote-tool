/**
 * Quote calculation service
 * Calculates print costs based on material, size, and requirements
 */

import { QuoteDetails, QuoteCalculation } from '@/types'
import { estimatePrintTime, estimateMaterialWeight } from '@/lib/utils/helpers'

// Material pricing per kilogram
const MATERIAL_PRICES = {
  PLA: 20,
  PETG: 25,
  TPU: 35,
  ABS: 22,
}

// Base fees
const DISCOVERY_FEE = 10 // One-time setup fee
const LABOR_MARKUP = 1.5 // 1.5x material cost
const RUSH_FEE_PERCENTAGE = 0.5 // 50% surcharge for rush orders

// Color/finish pricing
const COLOR_FEES = {
  custom: 20,
  standard: 0,
}

const FINISH_FEES = {
  standard: 0,
  smooth: 15, // Post-processing sanding/smoothing
  painted: 30, // Painting service
}

/**
 * Calculate quote based on project details
 */
export function calculateQuote(details: QuoteDetails): QuoteCalculation | null {
  // Need at least material and some dimension info
  if (!details.material || !details.dimensions) {
    return null
  }

  const material = details.material
  const pricePerKg = MATERIAL_PRICES[material]

  // Estimate weight
  const weightGrams = estimateMaterialWeight(details.dimensions)
  const weightKg = weightGrams / 1000

  // Calculate material cost
  const materialCost = weightKg * pricePerKg

  // Estimate print time
  const printTime = estimatePrintTime(details.dimensions)

  // Labor cost (based on material cost, not time - simpler for customers)
  const laborCost = materialCost * LABOR_MARKUP

  // Additional fees
  const colorFee = details.color && details.color.toLowerCase() !== 'standard'
    ? COLOR_FEES.custom
    : COLOR_FEES.standard

  const finishFee = FINISH_FEES[details.finish || 'standard']

  // Quantity multiplier
  const quantity = details.quantity || 1

  // Subtotal before rush fee
  let subtotal = (materialCost + laborCost + DISCOVERY_FEE + colorFee + finishFee) * quantity

  // Rush fee
  const rushFee = details.rushOrder ? subtotal * RUSH_FEE_PERCENTAGE : 0

  // Final total
  const total = subtotal + rushFee

  return {
    materialCost: Math.round(materialCost * 100) / 100,
    printTime,
    laborCost: Math.round(laborCost * 100) / 100,
    rushFee: Math.round(rushFee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    breakdown: {
      materialType: material,
      materialWeight: weightGrams,
      pricePerKg,
      printTimeHours: printTime,
      laborMarkup: LABOR_MARKUP,
    },
  }
}

/**
 * Format quote as human-readable text
 */
export function formatQuoteBreakdown(quote: QuoteCalculation, details: QuoteDetails): string {
  const lines: string[] = []

  lines.push('**QUOTE BREAKDOWN:**')
  lines.push('')
  lines.push(`Material: ${details.material} (${quote.breakdown.materialWeight}g estimated)`)
  lines.push(`Material Cost: $${quote.materialCost.toFixed(2)}`)
  lines.push(`Labor (${quote.breakdown.laborMarkup}x material): $${quote.laborCost.toFixed(2)}`)
  lines.push(`Estimated Print Time: ${quote.printTime} hours`)

  if (details.quantity && details.quantity > 1) {
    lines.push(`Quantity: ${details.quantity}`)
  }

  if (details.color && details.color.toLowerCase() !== 'standard') {
    lines.push(`Custom Color: +$20.00`)
  }

  if (details.finish && details.finish !== 'standard') {
    const finishName = details.finish.charAt(0).toUpperCase() + details.finish.slice(1)
    lines.push(`${finishName} Finish: +$${FINISH_FEES[details.finish].toFixed(2)}`)
  }

  if (quote.rushFee > 0) {
    lines.push(`Rush Order (50% surcharge): +$${quote.rushFee.toFixed(2)}`)
  }

  lines.push('')
  lines.push(`**TOTAL ESTIMATE: $${quote.total.toFixed(2)}** (plus shipping)`)
  lines.push('')
  lines.push('Ready to proceed? Submit your STL file at:')
  lines.push('https://moikas.com/products/moikas-3d-printing-service-request-a-quote')

  return lines.join('\n')
}

/**
 * Check if we have enough information to generate a quote
 */
export function canGenerateQuote(details: QuoteDetails): boolean {
  return !!(
    details.material &&
    details.dimensions &&
    details.dimensions.length
  )
}

/**
 * Get what information is still needed for a quote
 */
export function getMissingInfo(details: QuoteDetails): string[] {
  const missing: string[] = []

  if (!details.object) {
    missing.push('what you want to print')
  }

  if (!details.dimensions || !details.dimensions.length) {
    missing.push('dimensions/size')
  }

  if (!details.material) {
    missing.push('material preference (PLA/PETG/TPU)')
  }

  if (!details.quantity) {
    missing.push('quantity')
  }

  return missing
}
