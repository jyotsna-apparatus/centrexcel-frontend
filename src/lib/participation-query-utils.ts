import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate TanStack Query caches that mirror server participation state.
 * Call after enroll, payment confirm, or join-by-invite so list/detail UIs stay in sync.
 */
export async function invalidateParticipationQueries(
  queryClient: QueryClient,
  opts?: { challengeId?: string },
): Promise<void> {
  await Promise.all([
    opts?.challengeId
      ? queryClient.invalidateQueries({
          queryKey: ["my-participation", opts.challengeId],
        })
      : queryClient.invalidateQueries({ queryKey: ["my-participation"] }),
    queryClient.invalidateQueries({ queryKey: ["my-participations"] }),
    queryClient.invalidateQueries({ queryKey: ["my-participation-ids"] }),
  ]);
}
