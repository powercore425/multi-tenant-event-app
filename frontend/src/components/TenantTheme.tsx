'use client'

import { useEffect, useLayoutEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function TenantTheme() {
  const { user } = useAuthStore()

  // Use useLayoutEffect to apply colors synchronously before paint
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const tenant = user?.tenant

    if (tenant?.primaryColor || tenant?.secondaryColor) {
      // Apply primary color
      if (tenant.primaryColor) {
        root.style.setProperty('--tenant-primary', tenant.primaryColor)
        root.style.setProperty('--primary-color', tenant.primaryColor) // Also set for Layout component
        // Generate lighter and darker variants
        const primaryRgb = hexToRgb(tenant.primaryColor)
        if (primaryRgb) {
          root.style.setProperty('--tenant-primary-light', rgbToHex(
            Math.min(255, primaryRgb.r + 30),
            Math.min(255, primaryRgb.g + 30),
            Math.min(255, primaryRgb.b + 30)
          ))
          root.style.setProperty('--tenant-primary-dark', rgbToHex(
            Math.max(0, primaryRgb.r - 30),
            Math.max(0, primaryRgb.g - 30),
            Math.max(0, primaryRgb.b - 30)
          ))
        }
      }

      // Apply secondary color
      if (tenant.secondaryColor) {
        root.style.setProperty('--tenant-secondary', tenant.secondaryColor)
        root.style.setProperty('--secondary-color', tenant.secondaryColor) // Also set for Layout component
        const secondaryRgb = hexToRgb(tenant.secondaryColor)
        if (secondaryRgb) {
          root.style.setProperty('--tenant-secondary-light', rgbToHex(
            Math.min(255, secondaryRgb.r + 30),
            Math.min(255, secondaryRgb.g + 30),
            Math.min(255, secondaryRgb.b + 30)
          ))
          root.style.setProperty('--tenant-secondary-dark', rgbToHex(
            Math.max(0, secondaryRgb.r - 30),
            Math.max(0, secondaryRgb.g - 30),
            Math.max(0, secondaryRgb.b - 30)
          ))
        }
      }
    } else {
      // Reset to defaults
      root.style.removeProperty('--tenant-primary')
      root.style.removeProperty('--tenant-primary-light')
      root.style.removeProperty('--tenant-primary-dark')
      root.style.removeProperty('--tenant-secondary')
      root.style.removeProperty('--tenant-secondary-light')
      root.style.removeProperty('--tenant-secondary-dark')
      root.style.removeProperty('--primary-color')
      root.style.removeProperty('--secondary-color')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenant?.primaryColor, user?.tenant?.secondaryColor])

  // Also run on mount to ensure colors are applied immediately
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const tenant = user?.tenant

    if (tenant?.primaryColor || tenant?.secondaryColor) {
      if (tenant.primaryColor) {
        root.style.setProperty('--primary-color', tenant.primaryColor)
      }
      if (tenant.secondaryColor) {
        root.style.setProperty('--secondary-color', tenant.secondaryColor)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}
