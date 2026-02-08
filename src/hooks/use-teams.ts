'use client'

import { useQuery } from '@tanstack/react-query'
import { getTeams, type TeamListItem } from '@/lib/auth-api'

const REFETCH_INTERVAL_MS = 20_000

export type UseTeamsParams = {
  page: number
  pageSize: number
  search: string
  hackathonId?: string
}

export function useTeams({ page, pageSize, search, hackathonId }: UseTeamsParams) {
  return useQuery({
    queryKey: ['teams', page, pageSize, search, hackathonId],
    queryFn: () =>
      getTeams({
        page: page + 1,
        limit: pageSize,
        search: search.trim() || undefined,
        hackathonId,
      }),
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnMount: 'always',
  })
}

export type { TeamListItem }
