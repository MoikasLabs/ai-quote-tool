/**
 * JSON file-based storage utilities
 * Simple file storage for MVP (replace with DB later)
 */

import { Conversation, RateLimit } from '@/types'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations')
const QUOTES_DIR = path.join(DATA_DIR, 'quotes')
const RATE_LIMITS_FILE = path.join(DATA_DIR, 'rate-limits.json')

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [DATA_DIR, CONVERSATIONS_DIR, QUOTES_DIR]
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
}

// Conversation storage
export async function saveConversation(conversation: Conversation): Promise<void> {
  await ensureDirectories()
  const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`)
  await writeFile(filePath, JSON.stringify(conversation, null, 2))
}

export async function loadConversation(id: string): Promise<Conversation | null> {
  try {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`)
    if (!existsSync(filePath)) return null
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading conversation:', error)
    return null
  }
}

// Rate limit storage
export async function saveRateLimit(ip: string, limit: RateLimit): Promise<void> {
  await ensureDirectories()

  let limits: Record<string, RateLimit> = {}

  if (existsSync(RATE_LIMITS_FILE)) {
    try {
      const data = await readFile(RATE_LIMITS_FILE, 'utf-8')
      limits = JSON.parse(data)
    } catch (error) {
      console.error('Error reading rate limits:', error)
    }
  }

  limits[ip] = limit
  await writeFile(RATE_LIMITS_FILE, JSON.stringify(limits, null, 2))
}

export async function loadRateLimit(ip: string): Promise<RateLimit | null> {
  try {
    if (!existsSync(RATE_LIMITS_FILE)) return null

    const data = await readFile(RATE_LIMITS_FILE, 'utf-8')
    const limits = JSON.parse(data)
    return limits[ip] || null
  } catch (error) {
    console.error('Error loading rate limit:', error)
    return null
  }
}

// Clean up old data (call periodically)
export async function cleanupOldData(daysOld: number = 30): Promise<void> {
  // TODO: Implement cleanup of conversations older than X days
  console.log(`Cleanup not yet implemented (would delete data older than ${daysOld} days)`)
}
