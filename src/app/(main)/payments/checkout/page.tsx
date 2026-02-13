'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { createPayment } from '@/lib/auth-api'
import { useAuth } from '@/contexts/auth-context'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const MIN_AMOUNT_RS = 1
const MAX_AMOUNT_RS = 999999

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const hackathonId = searchParams.get('hackathonId') ?? undefined
  const presetAmount = searchParams.get('amount')
  const [amountRs, setAmountRs] = useState(() => {
    const n = presetAmount ? Number(presetAmount) : NaN
    return Number.isFinite(n) && n >= MIN_AMOUNT_RS ? String(n) : ''
  })

  const createMutation = useMutation({
    mutationFn: (amountPaisa: number) =>
      createPayment({
        amount: amountPaisa,
        redirectPath: '/payment/return',
        userId: user?.id,
        hackathonId,
      }),
    onSuccess: (data) => {
      const url = data?.data?.redirectUrl
      if (url) {
        window.location.href = url
      } else {
        toast.error('No redirect URL received')
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to initiate payment')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rs = Number.parseFloat(amountRs)
    if (Number.isNaN(rs) || rs < MIN_AMOUNT_RS || rs > MAX_AMOUNT_RS) {
      toast.error(`Enter an amount between ₹${MIN_AMOUNT_RS} and ₹${MAX_AMOUNT_RS}`)
      return
    }
    const paisa = Math.round(rs * 100)
    if (paisa < 100) {
      toast.error('Minimum amount is ₹1 (100 paisa)')
      return
    }
    createMutation.mutate(paisa)
  }

  return (
    <div>
      <PageHeader
        title="Pay with PhonePe"
        description="Enter the amount and you will be redirected to PhonePe to complete the payment."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={hackathonId ? `/hackathons/${hackathonId}` : '/dashboard'}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-6 max-w-md">
        <div className="rounded-lg border border-cs-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-medium text-cs-heading">
            <CreditCard className="size-5" />
            Payment details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-cs-heading">
                Amount (₹)
              </label>
              <Input
                id="amount"
                type="number"
                min={MIN_AMOUNT_RS}
                max={MAX_AMOUNT_RS}
                step="0.01"
                placeholder="e.g. 100"
                value={amountRs}
                onChange={(e) => setAmountRs(e.target.value)}
                disabled={createMutation.isPending}
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum ₹{MIN_AMOUNT_RS}. You will be redirected to PhonePe to pay securely.
              </p>
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Redirecting to PhonePe...' : 'Pay with PhonePe'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
