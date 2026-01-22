import { useAuthStore } from '@/store/authStore'

export function useTenantColors() {
  const { user } = useAuthStore()
  const primaryColor = user?.tenant?.primaryColor || '#3b82f6'
  const secondaryColor = user?.tenant?.secondaryColor || '#8b5cf6'

  const getHoverColor = (color: string) => {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    return rgbToHex(
      Math.max(0, rgb.r - 20),
      Math.max(0, rgb.g - 20),
      Math.max(0, rgb.b - 20)
    )
  }

  return {
    primaryColor,
    secondaryColor,
    getHoverColor,
    gradient: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
    gradientBr: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
  }
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
