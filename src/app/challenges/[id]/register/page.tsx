'use client'

import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import {
  fetchChallengeById,
  fetchMyTeams,
  registerParticipation,
  type Challenge,
  type Team,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RegisterChallengePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [mode, setMode] = useState<'solo' | 'team'>('solo')
  const [teamId, setTeamId] = useState('')

  const { data: challenge, isLoading: loadingChallenge } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => fetchChallengeById(id),
    enabled: !!id,
  })

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: fetchMyTeams,
    enabled: mode === 'team',
  })

  const registerMutation = useMutation({
    mutationFn: registerParticipation,
    onSuccess: () => {
      toast.success('Registered successfully')
      router.push('/dashboard/participations')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    if (mode === 'team' && !teamId) {
      toast.error('Select a team')
      return
    }
    registerMutation.mutate({
      challengeId: id,
      mode,
      teamId: mode === 'team' ? teamId : undefined,
    })
  }

  const challengeTeams = (teams as Team[]).filter((t) => t.challengeId === id)

  return (
    <AuthGuard>
      <div className="min-h-[100dvh] bg-cs-black">
        <div className="pattern" aria-hidden />
        <div className="relative z-10 mx-auto max-w-md px-4 py-12">
          <Link href={`/challenges/${id}`} className="link-highlight text-sm">
            ← Back to challenge
          </Link>
          {loadingChallenge || !challenge ? (
            <div className="mt-6 h-48 animate-pulse rounded-lg bg-cs-card" />
          ) : (
            <>
              <h1 className="h2 mt-4 text-cs-heading">Register</h1>
              <p className="p1 mt-1 text-cs-text">
                Register for {(challenge as Challenge).title}
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-cs-heading">Participation mode</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'solo'}
                        onChange={() => setMode('solo')}
                        className="rounded-full border-cs-border text-cs-primary focus:ring-cs-primary"
                      />
                      <span className="text-sm text-cs-text">Solo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'team'}
                        onChange={() => setMode('team')}
                        className="rounded-full border-cs-border text-cs-primary focus:ring-cs-primary"
                      />
                      <span className="text-sm text-cs-text">Team</span>
                    </label>
                  </div>
                </div>
                {mode === 'team' && (
                  <div>
                    <label htmlFor="team" className="mb-1 block text-sm font-medium text-cs-heading">
                      Select team
                    </label>
                    <select
                      id="team"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
                      required={mode === 'team'}
                    >
                      <option value="">Select team</option>
                      {challengeTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {challengeTeams.length === 0 && !loadingTeams && (
                      <p className="mt-1 text-xs text-cs-text">
                        No teams for this challenge. <Link href="/dashboard/teams/create" className="link-highlight">Create one</Link> first.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={
                      registerMutation.isPending ||
                      (mode === 'team' && !teamId) ||
                      (mode === 'team' && challengeTeams.length === 0)
                    }
                  >
                    Register
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/challenges/${id}`}>Cancel</Link>
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
