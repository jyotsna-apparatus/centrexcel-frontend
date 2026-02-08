'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/pageHeader/PageHeader'
import { getTeam } from '@/lib/auth-api'
import { toast } from 'sonner'
import { Users, Calendar, Code, Trophy } from 'lucide-react'

export default function ViewTeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: team, isLoading, isError, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeam(id),
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Team" description="View team details." />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isError || !team) {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load team')
    }
    return (
      <div>
        <PageHeader title="Team" description="View team details." />
        <Button variant="outline" asChild className="mt-4">
          <Link href="/users/teams">Back to list</Link>
        </Button>
      </div>
    )
  }

  const createdDate = team.createdAt
    ? (() => {
        try {
          return new Date(team.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        } catch {
          return team.createdAt
        }
      })()
    : '—'

  return (
    <div>
      <PageHeader title="Team" description="View team details.">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/users/teams">Back to list</Link>
          </Button>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="view-name" className="text-muted-foreground mb-1 block text-sm font-medium">
              Team Name
            </label>
            <Input
              id="view-name"
              value={team.name}
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>
          <div>
            <label htmlFor="view-hackathon" className="text-muted-foreground mb-1 block text-sm font-medium">
              Hackathon
            </label>
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              <Input
                id="view-hackathon"
                value={team.hackathon?.title ?? '—'}
                readOnly
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="view-invite-code" className="text-muted-foreground mb-1 block text-sm font-medium">
              Invite Code
            </label>
            <div className="flex items-center gap-2">
              <Code className="size-4 text-muted-foreground" />
              <Input
                id="view-invite-code"
                value={team.inviteCode}
                readOnly
                disabled
                className="bg-muted/50 font-mono"
              />
            </div>
          </div>
          <div>
            <label htmlFor="view-status" className="text-muted-foreground mb-1 block text-sm font-medium">
              Status
            </label>
            <Input
              id="view-status"
              value={
                team.isDissolved
                  ? 'Dissolved'
                  : team.deletionRequestedAt
                    ? 'Deletion Pending'
                    : 'Active'
              }
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>
          <div>
            <label htmlFor="view-created" className="text-muted-foreground mb-1 block text-sm font-medium">
              Created
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Input
                id="view-created"
                value={createdDate}
                readOnly
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-cs-border bg-cs-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Members ({team.members?.length ?? 0})</h3>
          </div>
          {team.members && team.members.length > 0 ? (
            <div className="space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border border-cs-border bg-cs-card/50 p-3"
                >
                  <div>
                    <div className="font-medium">
                      {member.user.username || member.user.email}
                    </div>
                    <div className="text-muted-foreground text-sm">{member.user.email}</div>
                  </div>
                  <div className="text-muted-foreground text-sm capitalize">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No members found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
