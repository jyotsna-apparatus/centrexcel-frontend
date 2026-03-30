"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreateWinnerBody,
  createWinner,
  getHackathonWinners,
  type Winner,
} from "@/lib/auth-api";

export function useHackathonWinners(hackathonId: string | null) {
  return useQuery({
    queryKey: ["hackathon-winners", hackathonId],
    queryFn: () => {
      if (hackathonId == null) throw new Error("Hackathon id required");
      return getHackathonWinners(hackathonId);
    },
    enabled: !!hackathonId,
  });
}

export function useCreateWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWinnerBody) => createWinner(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["hackathon-winners", variables.hackathonId],
      });
      queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });
}

export function useInvalidateWinners() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["hackathon-winners"] });
  };
}

export type { Winner, CreateWinnerBody };
