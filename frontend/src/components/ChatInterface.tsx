'use client'

/**
 * Main chat interface component
 */

import { useState, useEffect, useRef } from 'react'
import { Message } from './Message'
import { LoadingIndicator } from './LoadingIndicator'
import { RateLimitBanner } from './RateLimitBanner'
import { startQuote, sendMessage, getRateLimitStatus } from '@/lib/api-client'
import type { Message as MessageType, RateLimitStatus } from '@/types'

const EXAMPLE_QUESTIONS = [
  'How much to print a phone stand?',
  'Can you print a 6-inch dragon figurine?',
  "What's the difference between PLA and PETG?",
]

export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm here to help you get a quote for your 3D printing project. What would you like to print?",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load rate limit status on mount
  useEffect(() => {
    loadRateLimitStatus()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, loading])

  const loadRateLimitStatus = async () => {
    try {
      const status = await getRateLimitStatus()
      setRateLimitStatus(status)
    } catch (err) {
      console.error('Failed to load rate limit status:', err)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim()
    if (!userMessage || loading) return

    // Clear input and error
    setInput('')
    setError(null)

    // Add user message to UI
    const userMsg: MessageType = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      let currentConversationId = conversationId

      // Start new conversation if needed
      if (!currentConversationId) {
        const startResponse = await startQuote()
        currentConversationId = startResponse.conversationId
        setConversationId(currentConversationId)
      }

      // Send message
      const response = await sendMessage(currentConversationId, userMessage)

      // Add assistant response
      const assistantMsg: MessageType = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      // Update rate limit status
      await loadRateLimitStatus()
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message. Please try again.')

      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleExampleClick = (question: string) => {
    setInput(question)
    handleSendMessage(question)
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-6 text-center">
        <h1 className="text-2xl font-bold mb-2">🖨️ 3D Print Quote Calculator</h1>
        <p className="text-sm opacity-90">
          Get instant cost estimates for your 3D printing project
        </p>
      </div>

      {/* Rate Limit Banner */}
      <RateLimitBanner status={rateLimitStatus} />

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50"
      >
        {messages.map((msg, idx) => (
          <Message key={idx} message={msg} />
        ))}
        {loading && <LoadingIndicator />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Example Questions */}
      {messages.length === 1 && !loading && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Example Questions:
          </h3>
          <div className="space-y-2">
            {EXAMPLE_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(question)}
                className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about printing costs..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 hover:shadow-lg active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
