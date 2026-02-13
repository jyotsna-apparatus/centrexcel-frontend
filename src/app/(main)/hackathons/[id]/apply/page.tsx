'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeam, joinTeam } from '@/lib/auth-api'
import { useHackathon } from '@/hooks/use-hackathons'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Users, UserPlus, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = typeof params.id === 'string' ? params.id : ''

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(id || null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const createMutation = useMutation({
    mutationFn: (name: string) => createTeam({ name, hackathonId: id }),
    onSuccess: (data) => {
      toast.success('Team created successfully.')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      const teamId = data.data?.id
      router.push(teamId ? `/users/teams/${teamId}` : '/users/teams')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create team')
    },
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinTeam(code),
    onSuccess: (data) => {
      toast.success('Joined team successfully.')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      router.push(`/users/teams/${data.id}`)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to join team')
    },
  })

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    const name = teamName.trim()
    if (!name) {
      toast.error('Please enter a team name.')
      return
    }
    if (!id) return
    createMutation.mutate(name)
  }

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault()
    const code = inviteCode.trim()
    if (!code) {
      toast.error('Please enter an invite code.')
      return
    }
    joinMutation.mutate(code)
  }

  if (!id) {
    return (
      <div>
        <PageHeader title="Apply" description="Invalid hackathon." />
        <Button variant="outline" asChild>
          <Link href="/hackathons">Back to hackathons</Link>
        </Button>
      </div>
    )
  }

  if (hackathonLoading || !hackathon) {
    return (
      <div>
        <PageHeader title="Apply" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Apply to ${hackathon.title}`}
        description="Create a new team or join an existing one with an invite code."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hackathons/${id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to hackathon
          </Link>
        </Button>
      </PageHeader>

      {hackathon.isPaid && hackathon.priceOfEntry != null && Number(hackathon.priceOfEntry) > 0 && (
        <div className="mb-6 rounded-lg border border-cs-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-cs-heading">
            <CreditCard className="size-5" />
            Entry fee
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This hackathon has an entry fee of ₹{Number(hackathon.priceOfEntry).toFixed(2)}. Pay to complete your registration.
          </p>
          <Button asChild>
            <Link
              href={`/payments/checkout?hackathonId=${id}&amount=${Number(hackathon.priceOfEntry)}`}
            >
              Pay ₹{Number(hackathon.priceOfEntry).toFixed(2)} with PhonePe
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-cs-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-cs-heading">
            <Users className="size-5" />
            Create a team
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start a new team for this hackathon. You can invite others with your team&apos;s invite code.
          </p>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-cs-heading">
                Team name
              </label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                disabled={createMutation.isPending}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create team'}
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-cs-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-cs-heading">
            <UserPlus className="size-5" />
            Join with invite code
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Have an invite code from a team lead? Enter it below to join their team.
          </p>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="mb-1.5 block text-sm font-medium text-cs-heading">
                Invite code
              </label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                disabled={joinMutation.isPending}
                className="w-full"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join team'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
