'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useHackathon } from '@/hooks/use-hackathons'
import { useHackathonWinners } from '@/hooks/use-winners'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft, Calendar, User, Users, Trophy, Award, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [tabValue, setTabValue] = useState('details')

  const { user } = useAuth()
  const isParticipant = user?.role === 'participant'
  const { data: hackathon, isLoading, isError, error } = useHackathon(id || null)
  const { data: winners = [], isLoading: winnersLoading } = useHackathonWinners(id || null)

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
  const hasResults = Array.isArray(winners) && winners.length > 0
  const positionLabels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

  return (
    <div>
      <PageHeader
        title={hackathon.title}
        description={hackathon.shortDescription}
      >
        <div className="flex items-center gap-2">
          {isParticipant && (
            <Button variant="default" size="sm" asChild>
              <Link href={`/hackathons/${id}/apply`}>
                <UserPlus className="mr-2 size-4" />
                Apply
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/hackathons">
              <ArrowLeft className="mr-2 size-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Tabs value={tabValue} onValueChange={setTabValue} defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="results">
          {winnersLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : hasResults ? (
            <div className="rounded-lg border border-cs-border bg-card p-4">
              <h3 className="mb-4 flex items-center gap-2 font-medium text-cs-heading">
                <Trophy className="size-5" />
                Podium
              </h3>
              <div className="space-y-4">
                {winners
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((winner) => (
                    <div
                      key={winner.id}
                      className="flex items-center gap-4 rounded-md border border-cs-border bg-muted/30 p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cs-primary/20">
                        <Award className="size-5 text-cs-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-cs-heading">
                          {positionLabels[winner.position as 1 | 2 | 3] ?? winner.position} place
                        </p>
                        <p className="text-sm text-cs-text">
                          {winner.submission?.title ?? 'Submission'}
                        </p>
                        {winner.submission?.team && (
                          <p className="text-xs text-muted-foreground">
                            Team: {winner.submission.team.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Results not declared yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
