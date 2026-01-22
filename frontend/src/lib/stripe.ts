import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Initialize Stripe with proper configuration
 * 
 * Note: In development, you may see a warning about HTTP vs HTTPS.
 * This is expected and harmless - Stripe.js works fine over HTTP in development.
 * In production, your app will use HTTPS and the warning won't appear.
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.warn('Stripe publishable key is not configured')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}
