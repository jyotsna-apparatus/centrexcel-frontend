'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useHackathon } from '@/hooks/use-hackathons'
import { useHackathonWinners } from '@/hooks/use-winners'
import { useTeams } from '@/hooks/use-teams'
import { useSubmissionsByHackathon } from '@/hooks/use-submissions'
import { useQuery } from '@tanstack/react-query'
import {
  getParticipationForHackathon,
  getHackathonParticipations,
  downloadSubmission,
  downloadHackathonEntries,
} from '@/lib/auth-api'
import PageHeader from '@/components/pageHeader/PageHeader'
import { hackathonImageSrc } from '@/components/hackathon-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { useAuth } from '@/contexts/auth-context'
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  Trophy,
  Award,
  UserPlus,
  Pencil,
  Download,
  FileUp,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [tabValue, setTabValue] = useState('details')

  const { user } = useAuth()
  const isParticipant = user?.role === 'participant'
  const isAdmin = user?.role === 'admin'
  const isSponsor = user?.role === 'sponsor'
  const canSeeJudges = isAdmin || isSponsor
  const canSeeSubmissions = isAdmin || isSponsor
  const { data: hackathon, isLoading, isError, error } = useHackathon(id || null)
  const { data: submissions = [], isLoading: submissionsLoading } = useSubmissionsByHackathon(
    canSeeSubmissions && id ? id : null
  )
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const handleDownloadOne = useCallback(
    async (sub: { id: string; title: string }) => {
      if (downloadingId) return
      setDownloadingId(sub.id)
      try {
        await downloadSubmission(sub.id, `${sub.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.zip`)
        toast.success('Download started.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Download failed')
      } finally {
        setDownloadingId(null)
      }
    },
    [downloadingId]
  )

  const handleDownloadAll = useCallback(async () => {
    if (!id || downloadingAll) return
    setDownloadingAll(true)
    try {
      const blob = await downloadHackathonEntries(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hackathon-${id}-entries.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloadingAll(false)
    }
  }, [id, downloadingAll])
  const { data: winners = [], isLoading: winnersLoading } = useHackathonWinners(id || null)
  const { data: teamsData } = useTeams({
    page: 0,
    pageSize: 5,
    search: '',
    hackathonId: id || undefined,
  })
  const myTeamsForHackathon = teamsData?.data ?? []
  const hasTeamForHackathon = myTeamsForHackathon.length > 0
  const firstTeam = hasTeamForHackathon ? myTeamsForHackathon[0] : null
  const { data: participation } = useQuery({
    queryKey: ['participation', 'hackathon', id],
    queryFn: () => getParticipationForHackathon(id),
    enabled: !!id && isParticipant,
  })
  const { data: hackathonParticipations = [], isLoading: participationsLoading } = useQuery({
    queryKey: ['participations', 'hackathon', id],
    queryFn: () => getHackathonParticipations(id),
    enabled: !!id && isAdmin,
  })
  const hasSoloParticipation = participation && !participation.teamId
  const canSubmitSolo = hasSoloParticipation && !participation?.hasSubmitted

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

  const imageSrc = hackathonImageSrc(hackathon.image)

  return (
    <div>
      <PageHeader
        title={hackathon.title}
        description={hackathon.shortDescription}
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/hackathons/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          )}
          {isParticipant && (
            <>
              <Button variant="default" size="sm" asChild>
                <Link href={`/hackathons/${id}/apply`}>
                  <UserPlus className="mr-2 size-4" />
                  Participate
                </Link>
              </Button>
              {hasTeamForHackathon && firstTeam ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/hackathons/${id}/submit?teamId=${firstTeam.id}`}>
                    <Users className="mr-2 size-4" />
                    Submit with team
                  </Link>
                </Button>
              ) : canSubmitSolo ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/hackathons/${id}/submit?solo=1`}>
                    <User className="mr-2 size-4" />
                    Submit project
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/hackathons/${id}/apply`}>
                    <User className="mr-2 size-4" />
                    Enter solo
                  </Link>
                </Button>
              )}
            </>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/hackathons">
              <ArrowLeft className="mr-2 size-4" />
              Back to list
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {imageSrc && (
          <div className="w-full shrink-0 overflow-hidden rounded-lg border border-cs-border bg-muted lg:max-w-[500px]">
            <div className="relative w-full" style={{ aspectRatio: '5/3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Tabs value={tabValue} onValueChange={setTabValue} defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {canSeeSubmissions && (
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="participations">Participations</TabsTrigger>
              )}
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

          {canSeeJudges && hackathon.judges && hackathon.judges.length > 0 && (
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
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-cs-text [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: hackathon.instructions }}
              />
            </div>
          )}
        </TabsContent>

        {canSeeSubmissions && (
          <TabsContent value="submissions" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 font-medium text-cs-heading">
                <FileUp className="size-5" />
                Submissions
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={submissionsLoading || submissions.length === 0 || downloadingAll}
              >
                <Download className="mr-2 size-4" />
                {downloadingAll ? 'Preparing…' : 'Download all as ZIP'}
              </Button>
            </div>
            {submissionsLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : submissions.length === 0 ? (
              <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                <FileUp className="mx-auto size-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-cs-border bg-card p-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 rounded-md border border-cs-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-cs-heading">{sub.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.teamId ? (sub.team?.name ? `Team: ${sub.team.name}` : 'Team') : 'Solo'}
                        {sub.averageScore != null && <> · Avg score: {Number(sub.averageScore)}</>}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadOne(sub)}
                      disabled={downloadingId === sub.id}
                    >
                      <Download className="mr-2 size-4" />
                      {downloadingId === sub.id ? 'Downloading…' : 'Download'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="participations" className="space-y-4">
            <h3 className="flex items-center gap-2 font-medium text-cs-heading">
              <UserCheck className="size-5" />
              Participations
            </h3>
            {participationsLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : hackathonParticipations.length === 0 ? (
              <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
                <UserCheck className="mx-auto size-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No participations yet.</p>
              </div>
            ) : (
              <ul className="space-y-2 rounded-lg border border-cs-border bg-card p-4">
                {hackathonParticipations.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-cs-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-cs-heading">
                      {p.user?.username ?? p.user?.email ?? p.userId}
                    </span>
                    <span className="text-muted-foreground">
                      {p.teamId
                        ? p.team?.name
                          ? `Team: ${p.team.name}`
                          : 'Team'
                        : 'Solo'}
                    </span>
                    {p.hasSubmitted && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                        Submitted
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        )}

        <TabsContent value="results">
          {winnersLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : hasResults ? (
            <div className="rounded-lg border border-cs-border bg-card p-4">
              <h3 className="mb-4 flex items-center gap-2 font-medium text-cs-heading">
                <Trophy className="size-5" />
                Podium — Top 3
              </h3>
              <div className="space-y-4">
                {winners
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((winner) => {
                    const pos = winner.position as 1 | 2 | 3
                    const highlight =
                      pos === 1
                        ? 'border-amber-400/60 bg-amber-500/10 ring-2 ring-amber-400/30 dark:bg-amber-500/15'
                        : pos === 2
                          ? 'border-slate-400/60 bg-slate-500/10 ring-2 ring-slate-400/30 dark:bg-slate-500/15'
                          : pos === 3
                            ? 'border-amber-700/60 bg-amber-800/20 ring-2 ring-amber-700/30 dark:bg-amber-800/25'
                            : 'border-cs-border bg-muted/30'
                    const iconBg =
                      pos === 1
                        ? 'bg-amber-500/25 text-amber-700 dark:text-amber-400'
                        : pos === 2
                          ? 'bg-slate-500/25 text-slate-700 dark:text-slate-300'
                          : pos === 3
                            ? 'bg-amber-700/30 text-amber-800 dark:text-amber-500'
                            : 'bg-cs-primary/20 text-cs-primary'
                    return (
                      <div
                        key={winner.id}
                        className={`flex items-center gap-4 rounded-lg border p-4 ${highlight}`}
                      >
                        <div
                          className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                        >
                          <Award className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-cs-heading">
                            {positionLabels[pos] ?? winner.position} place
                          </p>
                          <p className="text-sm font-medium text-cs-text">
                            {winner.submission?.title ?? 'Submission'}
                          </p>
                          {winner.submission?.team ? (
                            <p className="text-xs text-muted-foreground">
                              Team: {winner.submission.team.name}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Solo</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
              <Trophy className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-4 font-medium text-cs-heading">Results not declared yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Results are declared automatically after the scoring deadline when all
                submissions have been scored, or when an admin or sponsor selects winners.
              </p>
            </div>
          )}
        </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
