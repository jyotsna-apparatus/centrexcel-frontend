'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getPaymentStatus } from '@/lib/auth-api'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const POLL_INTERVAL_MS = 2000
const TIMEOUT_MS = 120000

type Status = 'loading' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'timeout' | 'error'

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const merchantOrderId = searchParams.get('merchantOrderId')
  const [status, setStatus] = useState<Status>('loading')
  const [amount, setAmount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!merchantOrderId || typeof merchantOrderId !== 'string') {
      setStatus('error')
      setErrorMessage('Missing order reference. Please go back and try again.')
      return
    }

    let cancelled = false
    const start = Date.now()

    const poll = async () => {
      if (cancelled) return
      try {
        const res = await getPaymentStatus(merchantOrderId)
        const state = res?.data?.state?.toUpperCase()
        const amt = res?.data?.amount
        if (cancelled) return
        if (state === 'COMPLETED') {
          setStatus('COMPLETED')
          setAmount(amt ?? null)
          return
        }
        if (state === 'FAILED') {
          setStatus('FAILED')
          setAmount(amt ?? null)
          return
        }
        if (Date.now() - start > TIMEOUT_MS) {
          setStatus('timeout')
          setAmount(amt ?? null)
          return
        }
        setStatus('PENDING')
        setAmount(amt ?? null)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Could not verify payment.')
        return
      }
      if (cancelled) return
      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [merchantOrderId])

  const amountDisplay =
    amount !== null ? `₹${(amount / 100).toFixed(2)}` : ''

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-cs-border bg-card p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto size-12 animate-spin text-cs-primary" />
            <h1 className="mt-4 text-xl font-semibold text-cs-heading">
              Verifying your payment
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we confirm with PhonePe...
            </p>
          </>
        )}

        {status === 'PENDING' && (
          <>
            <Loader2 className="mx-auto size-12 animate-spin text-cs-primary" />
            <h1 className="mt-4 text-xl font-semibold text-cs-heading">
              Payment pending
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment is still being processed. This page will update automatically.
            </p>
          </>
        )}

        {status === 'COMPLETED' && (
          <>
            <CheckCircle className="mx-auto size-12 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold text-cs-heading">
              Payment successful
            </h1>
            {amountDisplay && (
              <p className="mt-2 text-cs-primary font-medium">{amountDisplay} paid successfully.</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for your payment.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}

        {(status === 'FAILED' || status === 'timeout' || status === 'error') && (
          <>
            <XCircle className="mx-auto size-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold text-cs-heading">
              {status === 'FAILED'
                ? 'Payment failed'
                : status === 'timeout'
                  ? 'Verification timed out'
                  : 'Something went wrong'}
            </h1>
            {status === 'FAILED' && amountDisplay && (
              <p className="mt-2 text-sm text-muted-foreground">
                Payment for {amountDisplay} was not completed.
              </p>
            )}
            {status === 'timeout' && (
              <p className="mt-2 text-sm text-muted-foreground">
                We could not verify your payment in time. If money was debited, it will be refunded.
              </p>
            )}
            {status === 'error' && errorMessage && (
              <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link href="/payments/checkout">Try again</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
