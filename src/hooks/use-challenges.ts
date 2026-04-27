import { useQuery } from "@tanstack/react-query";
import { listChallenges, type ListChallengesParams } from "@/lib/challenges-api";

export function useChallenges(params: ListChallengesParams & { page?: number } = {}) {
  return useQuery({
    queryKey: ["challenges", params],
    queryFn: () => listChallenges(params),
  });
}

export function useChallengesPage(opts: {
  page: number; // 0-indexed in UI
  pageSize: number;
  search?: string;
  status?: ListChallengesParams["status"];
  challengeType?: ListChallengesParams["challengeType"];
  approvalStatus?: ListChallengesParams["approvalStatus"];
  mine?: boolean;
}) {
  return useQuery({
    queryKey: ["challenges-page", opts],
    queryFn: () =>
      listChallenges({
        page: opts.page + 1,
        limit: opts.pageSize,
        search: opts.search,
        status: opts.status,
        challengeType: opts.challengeType,
        approvalStatus: opts.approvalStatus,
        mine: opts.mine,
      }),
  });
}
