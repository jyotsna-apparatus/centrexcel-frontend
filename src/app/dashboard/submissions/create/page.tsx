'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createSubmission,
  fetchMyParticipations,
  fetchMyTeams,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateSubmissionPage() {
  const router = useRouter()
  const [challengeId, setChallengeId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [title, setTitle] = useState('')
  const [idea, setIdea] = useState('')
  const [solution, setSolution] = useState('')
  const [linksStr, setLinksStr] = useState('')
  const [isDraft, setIsDraft] = useState(true)

  const { data: participations = [] } = useQuery({
    queryKey: ['participations', 'my'],
    queryFn: fetchMyParticipations,
  })
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: fetchMyTeams,
  })

  const createMutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: (sub) => {
      toast.success(isDraft ? 'Draft saved' : 'Submission created')
      router.push(`/dashboard/submissions/${sub.id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const participationsWithChallenge = participations.filter(
    (p) => p.challenge?.status === 'live' || p.challenge?.status === 'upcoming'
  )
  const teamsForChallenge = teams.filter((t) => t.challengeId === challengeId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeId || !title.trim() || !idea.trim() || !solution.trim()) {
      toast.error('Fill required fields')
      return
    }
    const links = linksStr
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    createMutation.mutate({
      challengeId,
      teamId: teamId || undefined,
      title: title.trim(),
      idea: idea.trim(),
      solution: solution.trim(),
      isDraft,
      links: links.length > 0 ? links : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <Link href="/dashboard/submissions" className="link-highlight text-sm">
          ← Back to submissions
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">New submission</h1>
        <p className="p1 mt-1 text-cs-text">Create a submission for a challenge you’re registered for.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="challenge" className="mb-1 block text-sm font-medium text-cs-heading">
            Challenge
          </label>
          <select
            id="challenge"
            value={challengeId}
            onChange={(e) => {
              setChallengeId(e.target.value)
              setTeamId('')
            }}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          >
            <option value="">Select challenge</option>
            {participationsWithChallenge.map((p) => (
              <option key={p.id} value={p.challengeId}>
                {p.challenge?.title}
              </option>
            ))}
          </select>
        </div>
        {teamsForChallenge.length > 0 && (
          <div>
            <label htmlFor="team" className="mb-1 block text-sm font-medium text-cs-heading">
              Team (optional)
            </label>
            <select
              id="team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            >
              <option value="">—</option>
              {teamsForChallenge.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-cs-heading">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI-Powered Healthcare Solution"
            required
          />
        </div>
        <div>
          <label htmlFor="idea" className="mb-1 block text-sm font-medium text-cs-heading">
            Idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Brief description of your idea"
            rows={4}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="solution" className="mb-1 block text-sm font-medium text-cs-heading">
            Solution
          </label>
          <textarea
            id="solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Detailed solution description"
            rows={6}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="links" className="mb-1 block text-sm font-medium text-cs-heading">
            Links (one per line or comma-separated)
          </label>
          <textarea
            id="links"
            value={linksStr}
            onChange={(e) => setLinksStr(e.target.value)}
            placeholder="https://github.com/...&#10;https://demo.example.com"
            rows={3}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="draft"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="rounded border-cs-border text-cs-primary focus:ring-cs-primary"
          />
          <label htmlFor="draft" className="text-sm text-cs-text">
            Save as draft (you can edit and finalize later)
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createMutation.isPending}>
            {isDraft ? 'Save draft' : 'Create submission'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/submissions">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
