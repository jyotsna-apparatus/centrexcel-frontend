'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useHackathon } from '@/hooks/use-hackathons'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { ArrowLeft, Calendar, User, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''

  const { data: hackathon, isLoading, isError, error } = useHackathon(id || null)

  if (isError && error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load hackathon')
  }

  if (isLoading || !id) {
    return (
      <div>
        <PageHeader title="Hackathon" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div>
        <PageHeader title="Hackathon" description="Not found." />
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  const statusLabel = HACKATHON_STATUS_LABELS[hackathon.status] ?? hackathon.status

  return (
    <div>
      <PageHeader
        title={hackathon.title}
        description={hackathon.shortDescription}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/hackathons">
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-lg border border-cs-border bg-card p-4">
          <h3 className="mb-2 font-medium text-cs-heading">Details</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status</span>
              <span>{statusLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span>Submission deadline: {new Date(hackathon.submissionDeadline).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span>Scoring deadline: {new Date(hackathon.scoringDeadline).toLocaleString()}</span>
            </div>
            {hackathon.sponsor && (
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Sponsor: {hackathon.sponsor.username ?? hackathon.sponsor.email}</span>
              </div>
            )}
            {hackathon.isPaid && hackathon.priceOfEntry != null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Entry fee</span>
                <span>${Number(hackathon.priceOfEntry).toFixed(2)}</span>
              </div>
            )}
          </dl>
        </div>

        {hackathon.judges && hackathon.judges.length > 0 && (
          <div className="rounded-lg border border-cs-border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium text-cs-heading">
              <Users className="size-4" />
              Judges
            </h3>
            <ul className="flex flex-wrap gap-2">
              {hackathon.judges.map((j) => (
                <li
                  key={j.id}
                  className="rounded-md bg-muted px-2 py-1 text-sm"
                >
                  {j.judge?.username ?? j.judge?.email ?? 'Judge'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hackathon.instructions && (
          <div className="rounded-lg border border-cs-border bg-card p-4">
            <h3 className="mb-2 font-medium text-cs-heading">Instructions</h3>
            <div className="whitespace-pre-wrap text-sm text-cs-text">
              {hackathon.instructions}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
