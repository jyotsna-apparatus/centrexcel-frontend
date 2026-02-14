'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeam, joinTeam, createParticipation } from '@/lib/auth-api'
import { useHackathon } from '@/hooks/use-hackathons'
import { useTeams } from '@/hooks/use-teams'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft, Users, CreditCard, User } from 'lucide-react'
import { toast } from 'sonner'

type TeamModalStep = 'choose' | 'create' | 'join' | 'existing'

export default function HackathonApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = typeof params.id === 'string' ? params.id : ''

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(id || null)
  const { data: teamsData } = useTeams({
    page: 0,
    pageSize: 20,
    search: '',
    hackathonId: undefined,
  })
  const allTeams = teamsData?.data ?? []
  const { user } = useAuth()
  const myTeamIds = new Set(
    allTeams.filter((t) => t.members?.some((m) => m.userId === user?.id)).map((t) => t.id)
  )
  const myTeams = allTeams.filter((t) => myTeamIds.has(t.id))
  const teamsInThisHackathon = myTeams.filter((t) =>
    t.participations?.some((p) => p.hackathon.id === id)
  )
  const hasTeamForHackathon = teamsInThisHackathon.length > 0
  const firstTeam = hasTeamForHackathon ? teamsInThisHackathon[0] : null
  const teamsNotInThisHackathon = myTeams.filter(
    (t) => !t.participations?.some((p) => p.hackathon.id === id)
  )

  const [soloModalOpen, setSoloModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [teamModalStep, setTeamModalStep] = useState<TeamModalStep>('choose')
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const createMutation = useMutation({
    mutationFn: (name: string) => createTeam({ name, hackathonId: id }),
    onSuccess: (data) => {
      toast.success('Team created successfully.')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['participations'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      setTeamModalOpen(false)
      setTeamModalStep('choose')
      setTeamName('')
      const teamId = (data as { data?: { id?: string } })?.data?.id
      router.push(teamId ? `/users/teams/${teamId}` : '/users/teams')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create team')
    },
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinTeam(code, id),
    onSuccess: (data) => {
      toast.success('Joined team successfully.')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['participations'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      setTeamModalOpen(false)
      setTeamModalStep('choose')
      setInviteCode('')
      router.push(`/users/teams/${data.id}`)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to join team')
    },
  })

  const participateSoloMutation = useMutation({
    mutationFn: (hackathonId: string) =>
      createParticipation({ hackathonId, type: 'solo' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participations'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      toast.success("You're in! Now submit your project.")
      setSoloModalOpen(false)
      router.push(`/hackathons/${id}/submit?solo=1`)
    },
    onError: (err: Error) => {
      if (err.message.includes('already participating')) {
        setSoloModalOpen(false)
        router.push(`/hackathons/${id}/submit?solo=1`)
        return
      }
      toast.error(err.message ?? 'Failed to participate')
    },
  })

  const participateWithTeamMutation = useMutation({
    mutationFn: (teamId: string) =>
      createParticipation({ hackathonId: id, type: 'team', teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participations'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      toast.success('Registered with team. Now submit your project.')
      setTeamModalOpen(false)
      setTeamModalStep('choose')
      router.push(`/hackathons/${id}/submit`)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to register with team')
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

  const openTeamModal = () => {
    setTeamModalStep('choose')
    setTeamName('')
    setInviteCode('')
    setTeamModalOpen(true)
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
        title={`Participate in ${hackathon.title}`}
        description="Choose how you want to compete: solo or with a team."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hackathons/${id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to hackathon
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 rounded-lg border border-cs-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-cs-heading mb-1">How it works</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li><strong>Solo:</strong> Enter alone and submit one project under your name.</li>
          <li><strong>Team:</strong> Create a new team or join one with an invite code, then submit one project for the team.</li>
        </ul>
      </div>

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
            <User className="size-5" />
            Solo
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Compete on your own. You’ll be enrolled and can submit your project before the deadline.
          </p>
          {hasTeamForHackathon ? (
            <>
              <Button variant="secondary" className="w-full" disabled>
                Solo (not available)
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                You’re already in a team. Withdraw from My participations to switch.
              </p>
              {firstTeam && (
                <Button variant="default" className="mt-3 w-full" asChild>
                  <Link href={`/hackathons/${id}/submit?teamId=${firstTeam.id}`}>
                    Submit with your team
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              disabled={participateSoloMutation.isPending}
              onClick={() => setSoloModalOpen(true)}
            >
              {participateSoloMutation.isPending ? 'Enrolling…' : 'Enter as solo'}
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-cs-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-cs-heading">
            <Users className="size-5" />
            Team
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create a new team or join an existing one with an invite code.
          </p>
          {hasTeamForHackathon ? (
            <>
              <Button variant="secondary" className="w-full" disabled>
                Team (already in one)
              </Button>
              {firstTeam && (
                <Button variant="default" className="mt-3 w-full" asChild>
                  <Link href={`/users/teams/${firstTeam.id}`}>View your team</Link>
                </Button>
              )}
            </>
          ) : (
            <Button variant="secondary" className="w-full" onClick={openTeamModal}>
              Enter as team
            </Button>
          )}
        </div>
      </div>

      {/* Solo confirmation modal */}
      <Dialog open={soloModalOpen} onOpenChange={setSoloModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter as solo?</DialogTitle>
            <DialogDescription>
              You’ll be enrolled in this hackathon as a solo participant. You can submit your project later from this hackathon’s page or My participations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoloModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={participateSoloMutation.isPending}
              onClick={() => participateSoloMutation.mutate(id)}
            >
              {participateSoloMutation.isPending ? 'Enrolling…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team modal: choose Create new | Join */}
      <Dialog open={teamModalOpen} onOpenChange={(open) => {
        setTeamModalOpen(open)
        if (!open) setTeamModalStep('choose')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {teamModalStep === 'choose' && 'Enter as team'}
              {teamModalStep === 'create' && 'Create new team'}
              {teamModalStep === 'join' && 'Join with invite code'}
              {teamModalStep === 'existing' && 'Use existing team'}
            </DialogTitle>
            <DialogDescription>
              {teamModalStep === 'choose' &&
                'Create a new team, join one with an invite code, or use a team you’re already in.'}
              {teamModalStep === 'create' &&
                'Choose a name for your team. You can use this team in multiple hackathons.'}
              {teamModalStep === 'join' &&
                'Enter the invite code shared by your team lead.'}
              {teamModalStep === 'existing' &&
                'Select a team to register for this hackathon.'}
            </DialogDescription>
          </DialogHeader>

          {teamModalStep === 'choose' && (
            <div className="flex flex-col gap-2 py-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setTeamModalStep('create')}
              >
                Create new team
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setTeamModalStep('join')}
              >
                Join with invite code
              </Button>
              {teamsNotInThisHackathon.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTeamModalStep('existing')}
                >
                  Use existing team
                </Button>
              )}
            </div>
          )}

          {teamModalStep === 'existing' && (
            <div className="space-y-2 py-2">
              {teamsNotInThisHackathon.map((team) => (
                <Button
                  key={team.id}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={participateWithTeamMutation.isPending}
                  onClick={() => participateWithTeamMutation.mutate(team.id)}
                >
                  {team.name}
                </Button>
              ))}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTeamModalStep('choose')}>
                  Back
                </Button>
              </DialogFooter>
            </div>
          )}

          {teamModalStep === 'create' && (
            <form onSubmit={handleCreateTeam} className="space-y-4 py-2">
              <div>
                <label htmlFor="modal-team-name" className="mb-1.5 block text-sm font-medium text-cs-heading">
                  Team name
                </label>
                <Input
                  id="modal-team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  disabled={createMutation.isPending}
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTeamModalStep('choose')}>
                  Back
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !teamName.trim()}>
                  {createMutation.isPending ? 'Creating…' : 'Create team'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {teamModalStep === 'join' && (
            <form onSubmit={handleJoinTeam} className="space-y-4 py-2">
              <div>
                <label htmlFor="modal-invite-code" className="mb-1.5 block text-sm font-medium text-cs-heading">
                  Invite code
                </label>
                <Input
                  id="modal-invite-code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  disabled={joinMutation.isPending}
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTeamModalStep('choose')}>
                  Back
                </Button>
                <Button type="submit" variant="secondary" disabled={joinMutation.isPending || !inviteCode.trim()}>
                  {joinMutation.isPending ? 'Joining…' : 'Join team'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
