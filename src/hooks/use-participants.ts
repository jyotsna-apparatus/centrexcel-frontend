'use client'

import { useQuery } from '@tanstack/react-query'
import { getUsers, type UserListItem } from '@/lib/auth-api'

const REFETCH_INTERVAL_MS = 20_000

export type UseParticipantsParams = {
  page: number
  pageSize: number
  search: string
}

export function useParticipants({ page, pageSize, search }: UseParticipantsParams) {
  return useQuery({
    queryKey: ['participants', page, pageSize, search],
    queryFn: () =>
      getUsers({
        page: page + 1,
        limit: pageSize,
        search: search.trim() || undefined,
        role: 'participant',
      }),
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}

export type { UserListItem }
