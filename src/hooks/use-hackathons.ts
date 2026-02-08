'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHackathons, getHackathon, type Hackathon, type HackathonListItem } from '@/lib/auth-api'

const REFETCH_INTERVAL_MS = 30_000

export type UseHackathonsParams = {
  page: number
  pageSize: number
  search?: string
  status?: string
  sponsorId?: string
}

export function useHackathons({ page, pageSize, search, status, sponsorId }: UseHackathonsParams) {
  return useQuery({
    queryKey: ['hackathons', page, pageSize, search, status, sponsorId],
    queryFn: () =>
      getHackathons({
        page: page + 1,
        limit: pageSize,
        search: search?.trim() || undefined,
        status,
        sponsorId,
      }),
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnMount: 'always',
  })
}

export function useHackathon(id: string | null) {
  return useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => getHackathon(id!),
    enabled: !!id,
  })
}

export function useInvalidateHackathons() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['hackathons'] })
    queryClient.invalidateQueries({ queryKey: ['hackathon'] })
    queryClient.invalidateQueries({ queryKey: ['hackathon-winners'] })
  }
}

export type { Hackathon, HackathonListItem }
