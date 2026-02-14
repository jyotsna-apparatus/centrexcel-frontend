'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyParticipations, withdrawParticipation } from '@/lib/auth-api'
import type { ParticipationListItem } from '@/lib/auth-api'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserCheck, FileUp, ExternalLink, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function ParticipationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10
  const [withdrawTarget, setWithdrawTarget] = useState<ParticipationListItem | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['participations', page, limit],
    queryFn: () => getMyParticipations({ page, limit }),
  })

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => withdrawParticipation(id),
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: ['participations'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      queryClient.invalidateQueries({ queryKey: ['participation', 'hackathon', result.hackathonId] })
      setWithdrawTarget(null)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to withdraw participation')
    },
  })

  const participations = data?.data ?? []
  const pagination = data?.pagination
  const totalCount = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load participations')
    }
  }, [isError, error])

  return (
    <div>
      <PageHeader
        title="My participations"
        description="Hackathons you’ve enrolled in. Submit your project before the deadline if you haven’t yet."
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : participations.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
          <UserCheck className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            You haven’t participated in any hackathon yet.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/hackathons">Browse hackathons</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {participations.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border border-cs-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-medium text-cs-heading">{p.hackathon.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.teamId ? (
                      <>Team: {p.team?.name ?? '—'}</>
                    ) : (
                      'Solo'
                    )}
                    {' · '}
                    {p.hasSubmitted ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Submitted</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Not submitted</span>
                    )}
                  </p>
                  {p.submission?.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(p.submission.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {p.hasSubmitted ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/submissions">
                        <ExternalLink className="mr-1.5 size-4" />
                        View submissions
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" asChild>
                        <Link
                          href={
                            p.teamId
                              ? `/hackathons/${p.hackathonId}/submit?teamId=${p.teamId}`
                              : `/hackathons/${p.hackathonId}/submit?solo=1`
                          }
                        >
                          <FileUp className="mr-1.5 size-4" />
                          Submit project
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawTarget(p)}
                        disabled={withdrawMutation.isPending}
                      >
                        <LogOut className="mr-1.5 size-4" />
                        Withdraw
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/hackathons/${p.hackathonId}`}>View hackathon</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!withdrawTarget}
        onOpenChange={(open) => !open && setWithdrawTarget(null)}
        title="Withdraw participation?"
        description={
          withdrawTarget
            ? `You will be unenrolled from "${withdrawTarget.hackathon.title}". ${
                withdrawTarget.teamId
                  ? 'You will also leave the team. '
                  : ''
              }You can participate again (solo or with a different team) before the deadline.`
            : ''
        }
        confirmLabel="Withdraw"
        variant="destructive"
        loading={withdrawMutation.isPending}
        onConfirm={() => withdrawTarget && withdrawMutation.mutate(withdrawTarget.id)}
      />
    </div>
  )
}
