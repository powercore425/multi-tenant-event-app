'use client'

import { useState, FormEvent } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
  registrationId?: string
}

export function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  registrationId,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment form validation failed')
        setProcessing(false)
        return
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/events`,
        },
        redirect: 'if_required',
      })

      if (paymentError) {
        setError(paymentError.message || 'Payment failed')
        onError(paymentError.message || 'Payment failed')
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        if (registrationId) {
          // Confirm payment on backend
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/registrations/${registrationId}/confirm-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentIntentId: paymentIntent.id,
                }),
              }
            )

            if (!response.ok) {
              throw new Error('Failed to confirm payment')
            }
          } catch (err: any) {
            console.error('Failed to confirm payment:', err)
            // Payment succeeded but confirmation failed - webhook should handle it
          }
        }
        onSuccess()
        setProcessing(false)
      } else {
        setProcessing(false)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An unexpected error occurred')
      onError(err.message || 'An unexpected error occurred')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Details
          </h3>
        </div>
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            <span>Pay ${amount.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  )
}
