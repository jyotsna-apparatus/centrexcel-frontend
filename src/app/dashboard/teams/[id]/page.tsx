'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  fetchTeamById,
  inviteToTeam,
  type Team,
} from '@/lib/api'
import { validateEmail } from '@/lib/validate'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function TeamDetailsPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeamById(id),
    enabled: !!id,
  })

  const inviteMutation = useMutation({
    mutationFn: ({ email }: { email: string }) => inviteToTeam(id, email),
    onSuccess: () => {
      toast.success('Invitation sent')
      setInviteEmail('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateEmail(inviteEmail)
    if (!validation.valid) {
      toast.error(validation.message ?? 'Invalid email')
      return
    }
    inviteMutation.mutate({ email: inviteEmail.trim() })
  }

  if (!id) {
    return (
      <div>
        <p className="p1 text-cs-text">Invalid team.</p>
        <Link href="/dashboard/teams" className="link-highlight mt-2 inline-block">
          Back to teams
        </Link>
      </div>
    )
  }

  if (isLoading && !team) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-64 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div>
        <p className="p1 text-destructive">Team not found.</p>
        <Link href="/dashboard/teams" className="link-highlight mt-2 inline-block">
          Back to teams
        </Link>
      </div>
    )
  }

  const t = team as Team
  const members = t.teamMembers ?? []

  return (
    <div className="space-y-8">
      <header>
        <Link href="/dashboard/teams" className="link-highlight text-sm">
          ← Back to teams
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">{t.name}</h1>
        {t.description && (
          <p className="p1 mt-1 text-cs-text">{t.description}</p>
        )}
        <p className="mt-2 text-sm text-cs-text">
          Challenge: <Link href={`/challenges/${t.challengeId}`} className="link-highlight">{t.challenge?.title ?? t.challengeId}</Link>
        </p>
      </header>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
          <Users className="size-4" />
          Members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="p1 mt-2 text-cs-text">No members yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded border border-cs-border bg-cs-black/40 px-3 py-2">
                <div>
                  <span className="font-medium text-cs-heading">{m.user?.name ?? 'Unknown'}</span>
                  <span className="ml-2 text-sm text-cs-text">{m.user?.email}</span>
                </div>
                <span className="text-xs text-cs-text">
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {t.inviteCode && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Invite others</h2>
          <p className="mt-1 text-sm text-cs-text">
            Share this code: <code className="rounded bg-cs-black/60 px-2 py-0.5 font-mono">{t.inviteCode}</code>
          </p>
          <form onSubmit={handleInvite} className="mt-4 flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" disabled={inviteMutation.isPending}>
              <Mail className="size-4" />
              Send invite
            </Button>
          </form>
        </section>
      )}

      <div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${t.challengeId}/register`}>Register for challenge</Link>
        </Button>
      </div>
    </div>
  )
}
