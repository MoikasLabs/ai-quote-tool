/**
 * Rate limit status banner component
 */

import type { RateLimitStatus } from '@/types'

interface RateLimitBannerProps {
  status: RateLimitStatus | null
}

export function RateLimitBanner({ status }: RateLimitBannerProps) {
  if (!status) {
    return (
      <div className="bg-gray-100 px-6 py-3 text-sm text-gray-600 border-b border-gray-200">
        Quotes: Loading...
      </div>
    )
  }

  const percentUsed = (status.quotesUsed / status.quotesLimit) * 100
  const isNearLimit = percentUsed >= 80

  return (
    <div
      className={`px-6 py-3 text-sm border-b ${
        isNearLimit
          ? 'bg-orange-50 text-orange-800 border-orange-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>
          Quotes: {status.quotesUsed}/{status.quotesLimit} this month
        </span>
        {status.currentConversation && (
          <span className="text-xs opacity-75">
            Messages: {status.currentConversation.messageCount}/
            {status.currentConversation.maxMessages}
          </span>
        )}
      </div>
      {isNearLimit && (
        <div className="mt-1 text-xs">
          Running low on quotes! Upgrade to Pro for 2,000 quotes/month.
        </div>
      )}
    </div>
  )
}
