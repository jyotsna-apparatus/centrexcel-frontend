"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, LogOut, Trash2, UserMinus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import {
  deleteTeamById,
  getMyParticipations,
  joinTeamByInvite,
  leaveTeam,
  patchTeamName,
  removeTeamMemberById,
} from "@/lib/challenges-api";
import type { ChallengeParticipation, TeamSummary } from "@/types/challenge";

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [renameTeamId, setRenameTeamId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["participations", "teams-page"],
    queryFn: () => getMyParticipations({ page: 1, limit: 50 }),
    enabled: user?.role === "participant",
  });

  const participations = data?.data ?? [];

  const teamsById = useMemo(() => {
    const m = new Map<string, { team: TeamSummary; parts: ChallengeParticipation[] }>();
    for (const p of participations) {
      const t = p.team;
      if (!t?.id) continue;
      const cur = m.get(t.id);
      if (cur) cur.parts.push(p);
      else m.set(t.id, { team: t, parts: [p] });
    }
    return m;
  }, [participations]);

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinTeamByInvite(code.trim()),
    onSuccess: () => {
      toast.success("Joined team");
      setInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameMutation = useMutation({
    mutationFn: ({ teamId, name }: { teamId: string; name: string }) =>
      patchTeamName(teamId, name),
    onSuccess: () => {
      toast.success("Team renamed");
      setRenameTeamId(null);
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMemberById(teamId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveMutation = useMutation({
    mutationFn: (teamId: string) => leaveTeam(teamId),
    onSuccess: () => {
      toast.success("You left the team");
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: string) => deleteTeamById(teamId),
    onSuccess: () => {
      toast.success("Team deleted");
      setDeleteTeamId(null);
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (user?.role !== "participant") {
    return (
      <div>
        <PageHeader title="Teams" description="Team management for participants." />
        <p className="text-sm text-muted-foreground">Switch to a participant account.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Manage teams"
        description="Invite codes, rename, leave, or delete teams for challenges you joined."
      />

      <div className="mb-8 rounded-lg border border-cs-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium text-cs-heading">Join with invite code</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Paste invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            disabled={joinMutation.isPending || !inviteCode.trim()}
            onClick={() => joinMutation.mutate(inviteCode)}
          >
            Join
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      ) : teamsById.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not enrolled in any challenge yet.
        </p>
      ) : (
        <div className="space-y-8">
          {[...teamsById.entries()].map(([teamId, { team }]) => {
            const isLeader = team.leaderId === user?.id;
            const myMember = team.members?.find((m) => m.userId === user?.id);
            const filled = team.members?.length ?? 0;
            const cap = team.lockedTeamSize;

            return (
              <div
                key={teamId}
                className="rounded-lg border border-cs-border bg-card p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-cs-heading">{team.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filled}/{cap} members · invite:{" "}
                      <code className="rounded bg-muted px-1">{team.inviteCode}</code>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(team.inviteCode);
                      toast.success("Copied invite code");
                    }}
                  >
                    <Copy className="mr-1 size-4" />
                    Copy code
                  </Button>
                </div>

                {renameTeamId === teamId ? (
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={renameMutation.isPending}
                      onClick={() =>
                        renameMutation.mutate({
                          teamId,
                          name: renameValue.trim(),
                        })
                      }
                    >
                      Save name
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRenameTeamId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  isLeader && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRenameTeamId(teamId);
                        setRenameValue(team.name);
                      }}
                    >
                      Rename team
                    </Button>
                  )
                )}

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-cs-heading">
                    <Users className="size-4" />
                    Members
                  </h4>
                  <ul className="space-y-2">
                    {(team.members ?? []).map((m) => {
                      const isSelf = m.userId === user?.id;
                      const canRemove =
                        isLeader && m.role !== "leader" && m.userId !== team.leaderId;
                      return (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cs-border/60 px-3 py-2 text-sm"
                        >
                          <span>
                            {m.user?.name ?? m.user?.username ?? m.user?.email ?? m.userId}
                            {m.role === "leader" ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (leader)
                              </span>
                            ) : null}
                          </span>
                          {canRemove ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={removeMemberMutation.isPending}
                              onClick={() =>
                                removeMemberMutation.mutate({
                                  teamId,
                                  userId: m.userId,
                                })
                              }
                            >
                              <UserMinus className="mr-1 size-4" />
                              Remove
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-cs-border/60 pt-4">
                  {!isLeader && myMember ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={leaveMutation.isPending}
                      onClick={() => leaveMutation.mutate(teamId)}
                    >
                      <LogOut className="mr-1 size-4" />
                      Leave team
                    </Button>
                  ) : null}
                  {isLeader ? (
                    <>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTeamId(teamId)}
                      >
                        <Trash2 className="mr-1 size-4" />
                        Delete team
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTeamId != null}
        onOpenChange={(o) => !o && setDeleteTeamId(null)}
        title="Delete this team?"
        description="This removes the team and related enrollments for this challenge. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTeamId) await deleteMutation.mutateAsync(deleteTeamId);
        }}
      />
    </div>
  );
}
