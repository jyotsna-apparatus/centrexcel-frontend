'use client'

import { useQuery } from '@tanstack/react-query'
import { getUsers, type UserListItem } from '@/lib/auth-api'

const REFETCH_INTERVAL_MS = 20_000

export type UseSponsorsParams = {
  page: number
  pageSize: number
  search: string
}

export function useSponsors({ page, pageSize, search }: UseSponsorsParams) {
  return useQuery({
    queryKey: ['sponsors', page, pageSize, search],
    queryFn: () =>
      getUsers({
        page: page + 1,
        limit: pageSize,
        search: search.trim() || undefined,
        role: 'sponsor',
      }),
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnMount: 'always',
  })
}

export type { UserListItem }
