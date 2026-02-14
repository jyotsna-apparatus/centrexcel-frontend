'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/pageHeader/PageHeader'
import { getTeam, updateTeam, removeTeamMember } from '@/lib/auth-api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Users, Calendar, Code, Trophy, FileUp, Pencil, UserMinus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function ViewTeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: team, isLoading, isError, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeam(id),
  })

  const [editNameOpen, setEditNameOpen] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [removeMemberUserId, setRemoveMemberUserId] = useState<string | null>(null)

  const isLeader = team?.members?.some(
    (m) => m.role === 'leader' && m.userId === user?.id
  )

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updateTeam(id, name),
    onSuccess: (data) => {
      queryClient.setQueryData(['team', id], data)
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team name updated.')
      setEditNameOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to update team name')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeTeamMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Member removed.')
      setRemoveMemberUserId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to remove member')
      setRemoveMemberUserId(null)
    },
  })

  const openEditName = () => {
    setEditNameValue(team?.name ?? '')
    setEditNameOpen(true)
  }

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
      <PageHeader title="Team" description="View and manage team details.">
        <div className="flex flex-wrap gap-2">
          {isLeader && !team.isDissolved && (
            <Button variant="secondary" size="sm" onClick={openEditName}>
              <Pencil className="mr-2 size-4" />
              Edit name
            </Button>
          )}
          {team.participations && team.participations.length > 0 && (
            <Button variant="default" size="sm" asChild>
              <Link href={`/hackathons/${team.participations[0].hackathon.id}/submit?teamId=${team.id}`}>
                <FileUp className="mr-2 size-4" />
                Submit project
              </Link>
            </Button>
          )}
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
            <div className="flex gap-2">
              <Input
                id="view-name"
                value={team.name}
                readOnly
                disabled
                className="bg-muted/50 flex-1"
              />
              {isLeader && !team.isDissolved && (
                <Button variant="outline" size="default" onClick={openEditName} title="Edit team name">
                  <Pencil className="mr-2 size-4" />
                  Edit name
                </Button>
              )}
            </div>
          </div>
          {team.participations && team.participations.length > 0 && (
            <div>
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
                Participating in
              </label>
              <ul className="space-y-1.5">
                {team.participations.map((p) => (
                  <li key={p.hackathon.id} className="flex items-center gap-2">
                    <Trophy className="size-4 text-muted-foreground shrink-0" />
                    <Link
                      href={`/hackathons/${p.hackathon.id}/submit?teamId=${team.id}`}
                      className="text-primary hover:underline"
                    >
                      {p.hackathon.title}
                    </Link>
                    <span className="text-muted-foreground text-sm">· Submit</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

        <div className="glass cs-card rounded-lg border border-cs-border p-4">
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
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm capitalize">
                      {member.role}
                    </span>
                    {isLeader && member.role !== 'leader' && !team.isDissolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRemoveMemberUserId(member.userId)}
                        title="Remove from team"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No members found.</p>
          )}
        </div>
      </div>

      {/* Edit team name modal */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team name</DialogTitle>
            <DialogDescription>
              Choose a new name. It must not be already taken by another team in this hackathon.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = editNameValue.trim()
              if (name && name !== team.name) updateNameMutation.mutate(name)
            }}
            className="space-y-4"
          >
            <Input
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              placeholder="Team name"
              disabled={updateNameMutation.isPending}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditNameOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateNameMutation.isPending ||
                  !editNameValue.trim() ||
                  editNameValue.trim() === team.name
                }
              >
                {updateNameMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove member confirm */}
      <ConfirmDialog
        open={removeMemberUserId != null}
        onOpenChange={(open) => !open && setRemoveMemberUserId(null)}
        title="Remove member"
        description={
          removeMemberUserId
            ? `Remove ${
                team.members?.find((m) => m.userId === removeMemberUserId)?.user?.username ||
                team.members?.find((m) => m.userId === removeMemberUserId)?.user?.email ||
                'this member'
              } from the team? They will need to rejoin with an invite code.`
            : ''
        }
        confirmLabel="Remove"
        variant="destructive"
        loading={removeMemberMutation.isPending}
        onConfirm={() => {
          if (removeMemberUserId) removeMemberMutation.mutate(removeMemberUserId)
        }}
      />
    </div>
  )
}
