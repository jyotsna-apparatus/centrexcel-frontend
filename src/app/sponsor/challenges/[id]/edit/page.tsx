'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  fetchChallengeById,
  updateChallenge,
  type Challenge,
  type ChallengeStatus,
  type ChallengeType,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const TYPES: { value: ChallengeType; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'startup_challenge', label: 'Startup challenge' },
]
const STATUSES: { value: ChallengeStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'closed', label: 'Closed' },
  { value: 'results_published', label: 'Results published' },
]

function toLocalDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditChallengePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ChallengeType>('free')
  const [fee, setFee] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  const [rewards, setRewards] = useState('')
  const [maxTeamSize, setMaxTeamSize] = useState('4')
  const [status, setStatus] = useState<ChallengeStatus>('draft')

  const { data: challenge, isLoading, error } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => fetchChallengeById(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Parameters<typeof updateChallenge>[1]) => updateChallenge(id, body),
    onSuccess: () => {
      toast.success('Challenge updated')
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (!challenge) return
    const c = challenge as Challenge
    setTitle(c.title)
    setDescription(c.description)
    setType(c.type)
    setFee(String(c.fee ?? 0))
    setStartDate(toLocalDateTime(c.startDate))
    setEndDate(toLocalDateTime(c.endDate))
    setSubmissionDeadline(toLocalDateTime(c.submissionDeadline))
    setRewards(c.rewards ?? '')
    setMaxTeamSize(String(c.maxTeamSize ?? 4))
    setStatus(c.status)
  }, [challenge])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !startDate || !endDate || !submissionDeadline) {
      toast.error('Fill required fields')
      return
    }
    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      type,
      fee: type === 'paid' ? Number.parseFloat(fee) || 0 : 0,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      submissionDeadline: new Date(submissionDeadline).toISOString(),
      rewards: rewards.trim() || undefined,
      maxTeamSize: Math.max(1, Number.parseInt(maxTeamSize, 10) || 4),
      status,
    })
  }

  if (!id) {
    return (
      <div>
        <p className="p1 text-cs-text">Invalid challenge.</p>
        <Link href="/sponsor" className="link-highlight mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (isLoading && !challenge) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-64 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div>
        <p className="p1 text-destructive">Challenge not found.</p>
        <Link href="/sponsor" className="link-highlight mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const c = challenge as Challenge

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <Link href="/sponsor" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Edit challenge</h1>
        <p className="p1 mt-1 text-cs-text">{c.title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/sponsor/challenges/${id}/problem`}>Upload problem statement</Link>
          </Button>
          {(c.status === 'closed' || c.status === 'live') && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/sponsor/challenges/${id}/results`}>Publish results</Link>
            </Button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-cs-heading">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-cs-heading">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-cs-heading">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChallengeType)}
              className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {type === 'paid' && (
            <div>
              <label htmlFor="fee" className="mb-1 block text-sm font-medium text-cs-heading">
                Fee
              </label>
              <Input
                id="fee"
                type="number"
                min={0}
                step={0.01}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-cs-heading">
              Start date
            </label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-cs-heading">
              End date
            </label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="submissionDeadline" className="mb-1 block text-sm font-medium text-cs-heading">
              Submission deadline
            </label>
            <Input
              id="submissionDeadline"
              type="datetime-local"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="rewards" className="mb-1 block text-sm font-medium text-cs-heading">
            Rewards (optional)
          </label>
          <textarea
            id="rewards"
            value={rewards}
            onChange={(e) => setRewards(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="maxTeamSize" className="mb-1 block text-sm font-medium text-cs-heading">
              Max team size
            </label>
            <Input
              id="maxTeamSize"
              type="number"
              min={1}
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-cs-heading">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ChallengeStatus)}
              className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            Save changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/sponsor">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
