/**
 * Loading indicator component (typing animation)
 */

export function LoadingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      {/* Icon */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-primary-500 text-white">
        🤖
      </div>

      {/* Typing animation */}
      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-primary-500 animate-bounce-dot"
            style={{ animationDelay: '-0.32s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary-500 animate-bounce-dot"
            style={{ animationDelay: '-0.16s' }}
          />
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce-dot" />
        </div>
      </div>
    </div>
  )
}
