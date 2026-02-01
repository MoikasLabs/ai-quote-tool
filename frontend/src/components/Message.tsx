/**
 * Message component for displaying chat messages
 */

import type { Message as MessageType } from '@/types'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
          isUser
            ? 'bg-green-500 text-white'
            : 'bg-primary-500 text-white'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[70%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
