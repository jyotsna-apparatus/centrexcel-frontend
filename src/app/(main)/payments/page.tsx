'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/lib/auth-api'
import { useAuth } from '@/contexts/auth-context'
import { canAccessPath } from '@/config/sidebar-nav'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_SIZE = 20

function StateBadge({ state }: { state: string }) {
  const className =
    state === 'COMPLETED'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : state === 'FAILED'
        ? 'bg-red-500/15 text-red-700 dark:text-red-400'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {state}
    </span>
  )
}

export default function TransactionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    if (user?.role && !canAccessPath('/payments', user.role)) {
      router.replace('/dashboard')
    }
  }, [user?.role, router])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['transactions', pageIndex, PAGE_SIZE, user?.id],
    queryFn: () => getTransactions({ page: pageIndex + 1, limit: PAGE_SIZE }),
    enabled: !!user,
  })

  const transactions = data?.data ?? []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const totalCount = pagination?.total ?? 0

  if (isError && error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load transactions')
  }

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'All transactions' : 'Transactions'}
        description={
          isAdmin ? 'View all payment transactions.' : 'View your payment transactions.'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/payments/checkout">
              <CreditCard className="mr-2 size-4" />
              {isAdmin ? 'New payment' : 'Pay with PhonePe'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-cs-border bg-card p-8">
          <p className="text-muted-foreground text-center">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-6 rounded-lg border border-cs-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No transactions yet.</p>
          {!isAdmin && (
            <Button className="mt-4" asChild>
              <Link href="/payments/checkout">Go to checkout</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-cs-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cs-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-cs-heading">Order ID</th>
                  <th className="px-4 py-3 text-left font-medium text-cs-heading">Amount (₹)</th>
                  <th className="px-4 py-3 text-left font-medium text-cs-heading">State</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left font-medium text-cs-heading">User</th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-cs-heading">Hackathon</th>
                  <th className="px-4 py-3 text-left font-medium text-cs-heading">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-cs-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-cs-text">{tx.merchantOrderId}</td>
                    <td className="px-4 py-3 text-cs-text">₹{(tx.amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StateBadge state={tx.state} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-muted-foreground">{tx.user?.email ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{tx.hackathon?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
