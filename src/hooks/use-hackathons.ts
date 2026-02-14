'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHackathons, getHackathon, getFeaturedHackathons, type Hackathon, type HackathonListItem } from '@/lib/auth-api'

const REFETCH_INTERVAL_MS = 30_000
const FEATURED_LIMIT = 3

export type UseHackathonsParams = {
  page: number
  pageSize: number
  search?: string
  status?: string
  sponsorId?: string
  forJudge?: 'me'
}

/** Hackathons assigned to the current user (judge). */
export function useJudgeHackathons(params: { page?: number; pageSize?: number }) {
  const page = params.page ?? 0
  const pageSize = params.pageSize ?? 20
  return useQuery({
    queryKey: ['hackathons', 'judge', page, pageSize],
    queryFn: () =>
      getHackathons({
        page: page + 1,
        limit: pageSize,
        forJudge: 'me',
      }),
    refetchOnMount: 'always',
  })
}

/** Public: top 3 hackathons for landing page. No auth required. */
export function useFeaturedHackathons(limit: number = FEATURED_LIMIT) {
  return useQuery({
    queryKey: ['featured-hackathons', limit],
    queryFn: () => getFeaturedHackathons(limit),
    refetchOnMount: 'always',
  })
}

export function useHackathons({ page, pageSize, search, status, sponsorId, forJudge }: UseHackathonsParams) {
  return useQuery({
    queryKey: ['hackathons', page, pageSize, search, status, sponsorId, forJudge],
    queryFn: () =>
      getHackathons({
        page: page + 1,
        limit: pageSize,
        search: search?.trim() || undefined,
        status,
        sponsorId,
        forJudge,
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
