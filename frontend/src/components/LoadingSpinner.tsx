'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', fullScreen = false, text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const spinnerSize = sizeClasses[size]

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Animated spinner with gradient */}
        <div className={`${spinnerSize} relative`}>
          <div
            className={`${spinnerSize} border-4 border-transparent rounded-full animate-spin`}
            style={{
              borderTopColor: '#3b82f6',
              borderRightColor: '#3b82f6',
              borderBottomColor: '#e5e7eb',
              borderLeftColor: '#e5e7eb',
            }}
          />
          <div
            className={`absolute inset-0 ${spinnerSize} border-4 border-transparent rounded-full animate-spin`}
            style={{
              animationDirection: 'reverse',
              animationDuration: '0.8s',
              borderTopColor: '#8b5cf6',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: '#8b5cf6',
            }}
          />
        </div>
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      {content}
    </div>
  )
}
