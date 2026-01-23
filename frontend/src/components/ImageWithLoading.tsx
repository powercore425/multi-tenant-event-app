'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface ImageWithLoadingProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  showBlur?: boolean
  showSpinner?: boolean
  blurDataURL?: string
}

// Simple SVG placeholder for blur effect
const createBlurPlaceholder = (width: number, height: number) => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#e5e7eb"/>
  </svg>`
  if (typeof window !== 'undefined') {
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
    } catch {
      // Fallback if btoa fails
      return `data:image/svg+xml,${encodeURIComponent(svg)}`
    }
  }
  // SSR fallback
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function ImageWithLoading({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  showBlur = true,
  showSpinner = true,
  blurDataURL,
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <span className="text-gray-400 dark:text-gray-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  const placeholder = blurDataURL || createBlurPlaceholder(width, height)

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Blur placeholder background */}
      {showBlur && isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Scale up to avoid blur edges
          }}
        />
      )}

      {/* Loading spinner overlay */}
      {showSpinner && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
          <div className="relative">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        </div>
      )}

      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized
      />
    </div>
  )
}
