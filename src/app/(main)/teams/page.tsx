"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTeams } from "@/hooks/use-teams";
import {
  approveTeamJoinRequest,
  getPendingJoinRequests,
  rejectTeamJoinRequest,
  removeTeamMember,
} from "@/lib/auth-api";

const TEAM_SIZE_MAX = 4;

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(
    null,
  );
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );

  const { data: teamsData, isLoading } = useTeams({
    page: 0,
    pageSize: 100,
    search: "",
    hackathonId: undefined,
  });

  const myTeams = useMemo(
    () =>
      (teamsData?.data ?? []).filter((team) =>
        team.members.some((member) => member.userId === user?.id),
      ),
    [teamsData?.data, user?.id],
  );

  const selectedTeam =
    myTeams.find((team) => team.id === selectedTeamId) ?? myTeams[0] ?? null;
  const isTeamLeader = selectedTeam?.members.some(
    (member) => member.userId === user?.id && member.role === "leader",
  );

  const { data: pendingJoinRequests = [] } = useQuery({
    queryKey: ["team", selectedTeam?.id, "join-requests"],
    queryFn: async () => {
      if (!selectedTeam?.id) return [];
      return getPendingJoinRequests(selectedTeam.id);
    },
    enabled: Boolean(selectedTeam?.id && isTeamLeader),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!selectedTeam?.id) throw new Error("Team not selected");
      await removeTeamMember(selectedTeam.id, memberUserId);
    },
    onMutate: (memberUserId) => setRemovingMemberId(memberUserId),
    onSuccess: () => {
      toast.success("Member removed.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Failed to remove member"),
    onSettled: () => setRemovingMemberId(null),
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!selectedTeam?.id) throw new Error("Team not selected");
      await approveTeamJoinRequest(selectedTeam.id, requestId);
    },
    onMutate: (requestId) => setApprovingRequestId(requestId),
    onSuccess: () => {
      toast.success("Join request approved.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({
        queryKey: ["team", selectedTeam?.id, "join-requests"],
      });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Failed to approve request"),
    onSettled: () => setApprovingRequestId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!selectedTeam?.id) throw new Error("Team not selected");
      await rejectTeamJoinRequest(selectedTeam.id, requestId);
    },
    onMutate: (requestId) => setRejectingRequestId(requestId),
    onSuccess: () => {
      toast.success("Join request rejected.");
      queryClient.invalidateQueries({
        queryKey: ["team", selectedTeam?.id, "join-requests"],
      });
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Failed to reject request"),
    onSettled: () => setRejectingRequestId(null),
  });

  return (
    <div>
      <PageHeader
        title="Manage team"
        description="Manage members and approve join requests for your teams."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading teams...</p>
      ) : myTeams.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            You are not part of any team yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-cs-border bg-card p-4">
            <p className="mb-3 text-sm font-medium text-cs-heading">
              Your teams
            </p>
            <div className="flex flex-wrap gap-2">
              {myTeams.map((team) => (
                <Button
                  key={team.id}
                  type="button"
                  variant={selectedTeam?.id === team.id ? "default" : "outline"}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  {team.name}
                </Button>
              ))}
            </div>
          </div>

          {selectedTeam && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-cs-border bg-card p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium text-cs-heading">
                  <Users className="size-4" />
                  Members ({selectedTeam.members.length}/{TEAM_SIZE_MAX})
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Invite code:{" "}
                  <span className="font-mono">{selectedTeam.inviteCode}</span>
                </p>
                <ul className="space-y-2">
                  {selectedTeam.members.map((member) => {
                    const isLeaderMember = member.role === "leader";
                    const canRemove = isTeamLeader && !isLeaderMember;
                    const displayName =
                      member.user.username ?? member.user.email;

                    return (
                      <li
                        key={member.id}
                        className="flex items-center justify-between rounded-md border border-cs-border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-cs-heading">
                            {displayName}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {isLeaderMember ? "Team admin" : "Member"}
                          </span>
                        </div>
                        {canRemove ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={removingMemberId === member.userId}
                            onClick={() =>
                              removeMemberMutation.mutate(member.userId)
                            }
                          >
                            <UserMinus className="mr-2 size-4" />
                            {removingMemberId === member.userId
                              ? "Removing..."
                              : "Remove"}
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-lg border border-cs-border bg-card p-4">
                <h3 className="mb-2 font-medium text-cs-heading">
                  Pending join requests
                </h3>
                {!isTeamLeader ? (
                  <p className="text-sm text-muted-foreground">
                    Only team admins can approve or reject join requests.
                  </p>
                ) : pendingJoinRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pending requests.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {pendingJoinRequests.map((request) => {
                      const isActionLoading =
                        approvingRequestId === request.id ||
                        rejectingRequestId === request.id;
                      const canApprove =
                        selectedTeam.members.length < TEAM_SIZE_MAX;
                      return (
                        <li
                          key={request.id}
                          className="rounded-md border border-cs-border bg-muted/20 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-cs-heading">
                            {request.user?.username ??
                              request.user?.email ??
                              request.userId}
                          </p>
                          <p className="mb-2 text-xs text-muted-foreground">
                            Requested on{" "}
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={!canApprove || isActionLoading}
                              onClick={() => approveMutation.mutate(request.id)}
                            >
                              {approvingRequestId === request.id
                                ? "Approving..."
                                : "Approve"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isActionLoading}
                              onClick={() => rejectMutation.mutate(request.id)}
                            >
                              {rejectingRequestId === request.id
                                ? "Rejecting..."
                                : "Reject"}
                            </Button>
                          </div>
                          {!canApprove ? (
                            <p className="mt-2 text-xs text-destructive">
                              Team already has {TEAM_SIZE_MAX} members.
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
