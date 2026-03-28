'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getMyParticipations } from '@/lib/auth-api'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserCheck, FileUp, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function ParticipationsPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['participations', page, limit],
    queryFn: () => getMyParticipations({ page, limit }),
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
        description="Challenges you’ve enrolled in. Submit your project before the deadline if you haven’t yet."
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
            <Link href="/hackathons">Browse challenges</Link>
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

    </div>
  )
}
