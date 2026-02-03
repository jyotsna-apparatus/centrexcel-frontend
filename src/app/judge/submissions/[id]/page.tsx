'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  fetchSubmissionById,
  scoreSubmission,
  type Submission,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText, Link2, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ScoreSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmissionById(id),
    enabled: !!id,
  })

  const scoreMutation = useMutation({
    mutationFn: () =>
      scoreSubmission(id, {
        score: Number.parseFloat(score),
        feedback: feedback.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Submission scored')
      router.push('/judge/submissions')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number.parseFloat(score)
    if (Number.isNaN(num) || num < 0 || num > 100) {
      toast.error('Score must be between 0 and 100')
      return
    }
    scoreMutation.mutate()
  }

  if (!id) {
    return (
      <div>
        <p className="p1 text-cs-text">Invalid submission.</p>
        <Link href="/judge/submissions" className="link-highlight mt-2 inline-block">
          Back to submissions
        </Link>
      </div>
    )
  }

  if (isLoading && !submission) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-64 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div>
        <p className="p1 text-destructive">Submission not found.</p>
        <Link href="/judge/submissions" className="link-highlight mt-2 inline-block">
          Back to submissions
        </Link>
      </div>
    )
  }

  const s = submission as Submission

  return (
    <div className="space-y-8">
      <header>
        <Link href="/judge/submissions" className="link-highlight text-sm">
          ← Back to submissions
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">{s.title}</h1>
        <p className="p1 mt-1 text-cs-text">{s.challenge?.title}</p>
        {s.team?.name && (
          <p className="text-sm text-cs-text">Team: {s.team.name}</p>
        )}
      </header>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Idea</h2>
        <p className="mt-2 whitespace-pre-wrap text-cs-text">{s.idea}</p>
      </section>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Solution</h2>
        <p className="mt-2 whitespace-pre-wrap text-cs-text">{s.solution}</p>
      </section>

      {s.links && s.links.length > 0 && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
            <Link2 className="size-4" />
            Links
          </h2>
          <ul className="mt-2 space-y-1">
            {s.links.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-highlight break-all text-sm"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.fileUrl && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
            <FileText className="size-4" />
            Attached file
          </h2>
          <a
            href={s.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-highlight mt-2 inline-block text-sm"
          >
            View file
          </a>
        </section>
      )}

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Score this submission</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="score" className="mb-1 block text-sm font-medium text-cs-heading">
              Score (0–100)
            </label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 85.5"
              required
            />
          </div>
          <div>
            <label htmlFor="feedback" className="mb-1 block text-sm font-medium text-cs-heading">
              Feedback (optional)
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Written feedback for the participant..."
              className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={scoreMutation.isPending}>
              <Send className="size-4" />
              Submit score
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/judge/submissions">Cancel</Link>
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
