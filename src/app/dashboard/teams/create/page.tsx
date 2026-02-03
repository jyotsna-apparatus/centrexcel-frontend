'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTeam, fetchChallenges } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateTeamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [challengeId, setChallengeId] = useState('')

  const { data: challenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (team) => {
      toast.success('Team created')
      router.push(`/dashboard/teams/${team.id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Team name is required')
      return
    }
    if (!challengeId) {
      toast.error('Please select a challenge')
      return
    }
    createMutation.mutate({ name: name.trim(), challengeId, description: description.trim() || undefined })
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <Link href="/dashboard/teams" className="link-highlight text-sm">
          ← Back to teams
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Create team</h1>
        <p className="p1 mt-1 text-cs-text">Create a new team for a challenge.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-cs-heading">
            Team name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Alpha"
            required
          />
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
            <option value="">Select a challenge</option>
            {challenges
              .filter((c) => c.status === 'live' || c.status === 'upcoming')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-cs-heading">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your team"
            rows={3}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createMutation.isPending || loadingChallenges}>
            Create team
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/teams">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
