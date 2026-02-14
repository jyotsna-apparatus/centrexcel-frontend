'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHackathon } from '@/hooks/use-hackathons'
import { useSubmissionsByHackathon } from '@/hooks/use-submissions'
import { useAuth } from '@/contexts/auth-context'
import { createScore, downloadSubmission, type Submission } from '@/lib/auth-api'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { ArrowLeft, FileUp, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'

const SCORE_MIN = 0
const SCORE_MAX = 100

export default function JudgeHackathonSubmissionsPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const { user } = useAuth()

  useEffect(() => {
    if (user && user.role !== 'judge') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(id || null)
  const { data: submissions = [], isLoading: submissionsLoading } =
    useSubmissionsByHackathon(id || null)

  const [scoreSheetOpen, setScoreSheetOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [reviewedForScoring, setReviewedForScoring] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const createScoreMutation = useMutation({
    mutationFn: (body: { submissionId: string; score: number; feedback?: string | null }) =>
      createScore(body),
    onSuccess: () => {
      toast.success('Score submitted.')
      queryClient.invalidateQueries({ queryKey: ['submissions-hackathon', id] })
      setScoreSheetOpen(false)
      setSelectedSubmission(null)
      setScoreInput('')
      setFeedbackInput('')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to submit score')
    },
  })

  const openScoreSheet = (sub: Submission) => {
    const myScore = sub.scores?.find((s) => s.judgeId === user?.id)
    setSelectedSubmission(sub)
    setScoreInput(myScore != null ? String(myScore.score) : '')
    setFeedbackInput(myScore?.feedback ?? '')
    setReviewedForScoring(false)
    setScoreSheetOpen(true)
  }

  const handleDownload = async (sub: Submission) => {
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
  }

  const selectedMyScore = selectedSubmission?.scores?.find((s) => s.judgeId === user?.id)
  const alreadyScored = !!selectedMyScore

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return
    const score = parseInt(scoreInput, 10)
    if (Number.isNaN(score) || score < SCORE_MIN || score > SCORE_MAX) {
      toast.error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`)
      return
    }
    createScoreMutation.mutate({
      submissionId: selectedSubmission.id,
      score,
      feedback: feedbackInput.trim() || null,
    })
  }

  const isLoading = hackathonLoading || submissionsLoading

  if (user && user.role !== 'judge') {
    return null
  }

  if (!id) {
    return (
      <div>
        <PageHeader title="Submissions" description="Invalid hackathon." />
        <Button variant="outline" asChild>
          <Link href="/judge/hackathons">Back</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={hackathon ? `Submissions — ${hackathon.title}` : 'Submissions'}
        description="View and score submissions for this hackathon."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/judge/hackathons">
            <ArrowLeft className="mr-2 size-4" />
            Back to hackathons
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
          <FileUp className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const myScore = sub.scores?.find((s) => s.judgeId === user?.id)
            const scoredByMe = !!myScore
            return (
              <div
                key={sub.id}
                className="flex flex-col gap-3 rounded-lg border border-cs-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-cs-heading">{sub.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sub.teamId ? (sub.team?.name ? `Team: ${sub.team.name}` : 'Team') : 'Solo'}
                    {sub.averageScore != null && (
                      <> · Avg score: {Number(sub.averageScore)}</>
                    )}
                  </p>
                  {scoredByMe && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Scored by you: {myScore.score}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(sub)}
                    disabled={downloadingId === sub.id}
                  >
                    <Download className="mr-1 size-4" />
                    {downloadingId === sub.id ? 'Downloading…' : 'Download'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openScoreSheet(sub)}
                  >
                    {scoredByMe ? 'View score' : 'Score'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={scoreSheetOpen} onOpenChange={setScoreSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedSubmission ? selectedSubmission.title : 'Score submission'}
            </SheetTitle>
          </SheetHeader>
          {selectedSubmission && (
            <div className="flex flex-1 flex-col gap-4 overflow-auto px-4">
              {selectedSubmission.description && (
                <div>
                  <p className="text-sm font-medium text-cs-heading">Description</p>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </p>
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedSubmission)}
                  disabled={downloadingId === selectedSubmission.id}
                >
                  <Download className="mr-2 size-4" />
                  {downloadingId === selectedSubmission.id ? 'Downloading…' : 'Download submission'}
                </Button>
              </div>
              {!alreadyScored && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewedForScoring}
                    onChange={(e) => setReviewedForScoring(e.target.checked)}
                    className="border-cs-border rounded border"
                  />
                  <span className="text-cs-heading">I have reviewed this submission (required before scoring)</span>
                </label>
              )}
              <form id="score-form" onSubmit={handleSubmitScore} className="space-y-4">
                <div>
                  <label htmlFor="score" className="mb-1.5 block text-sm font-medium text-cs-heading">
                    Score (0–100) *
                  </label>
                  <Input
                    id="score"
                    type="number"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    disabled={createScoreMutation.isPending || alreadyScored || (!alreadyScored && !reviewedForScoring)}
                  />
                </div>
                <div>
                  <label htmlFor="feedback" className="mb-1.5 block text-sm font-medium text-cs-heading">
                    Feedback (optional)
                  </label>
                  <textarea
                    id="feedback"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    disabled={createScoreMutation.isPending || alreadyScored || (!alreadyScored && !reviewedForScoring)}
                    className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
                    rows={4}
                    placeholder="Optional feedback for the participant"
                  />
                </div>
              </form>
            </div>
          )}
          <SheetFooter>
            {!alreadyScored && (
              <Button
                type="submit"
                form="score-form"
                disabled={createScoreMutation.isPending || !reviewedForScoring}
              >
                {createScoreMutation.isPending ? 'Submitting…' : 'Submit score'}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
