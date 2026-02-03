'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  assignJudge,
  fetchChallenges,
  fetchInvites,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AssignJudgePage() {
  const router = useRouter()
  const [judgeId, setJudgeId] = useState('')
  const [challengeId, setChallengeId] = useState('')

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })
  const { data: invites = [] } = useQuery({
    queryKey: ['auth', 'invites'],
    queryFn: fetchInvites,
  })

  const assignMutation = useMutation({
    mutationFn: () => assignJudge({ judgeId, challengeId }),
    onSuccess: () => {
      toast.success('Judge assigned')
      setJudgeId('')
      setChallengeId('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!judgeId || !challengeId) {
      toast.error('Select judge and challenge')
      return
    }
    assignMutation.mutate()
  }

  const acceptedJudges = invites.filter((i) => i.status === 'accepted')
  const judgeOptions = acceptedJudges

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <Link href="/admin" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Assign judge</h1>
        <p className="p1 mt-1 text-cs-text">
          Assign a judge to evaluate submissions for a challenge. (API expects judge user ID; you may need to use accepted judge emails or backend-provided list.)
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="judge" className="mb-1 block text-sm font-medium text-cs-heading">
            Judge (user ID from backend)
          </label>
          <Input
            id="judge"
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            placeholder="Judge user UUID"
            required
          />
          <p className="mt-1 text-xs text-cs-text">
            Accepted invitations: {judgeOptions.map((j) => j.email).join(', ') || 'None'}
          </p>
        </div>
        <div>
          <label htmlFor="challenge" className="mb-1 block text-sm font-medium text-cs-heading">
            Challenge
          </label>
          <select
            id="challenge"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          >
            <option value="">Select challenge</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={assignMutation.isPending}>
            Assign judge
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
