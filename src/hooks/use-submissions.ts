"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHackathonSubmissionThreads,
  getMySubmissionThread,
  getSubmission,
  getSubmissions,
  getSubmissionsByHackathon,
  type Submission,
  type SubmissionListItem,
  type SubmissionThread,
  type SubmissionThreadEntry,
} from "@/lib/auth-api";

const REFETCH_INTERVAL_MS = 20_000;

export type UseSubmissionsParams = {
  page: number;
  pageSize: number;
};

export function useSubmissions({ page, pageSize }: UseSubmissionsParams) {
  return useQuery({
    queryKey: ["submissions", page, pageSize],
    queryFn: () => getSubmissions({ page: page + 1, limit: pageSize }),
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnMount: "always",
  });
}

export function useSubmission(id: string | null) {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => {
      if (id == null) throw new Error("Submission id required");
      return getSubmission(id);
    },
    enabled: !!id,
  });
}

export function useSubmissionsByHackathon(hackathonId: string | null) {
  return useQuery({
    queryKey: ["submissions-hackathon", hackathonId],
    queryFn: () => {
      if (hackathonId == null) throw new Error("Hackathon id required");
      return getSubmissionsByHackathon(hackathonId);
    },
    enabled: !!hackathonId,
  });
}

export function useMySubmissionThread(hackathonId: string | null) {
  return useQuery({
    queryKey: ["submission-thread-me", hackathonId],
    queryFn: () => {
      if (hackathonId == null) throw new Error("Hackathon id required");
      return getMySubmissionThread(hackathonId);
    },
    enabled: !!hackathonId,
  });
}

export function useHackathonSubmissionThreads(hackathonId: string | null) {
  return useQuery({
    queryKey: ["submission-threads-hackathon", hackathonId],
    queryFn: () => {
      if (hackathonId == null) throw new Error("Hackathon id required");
      return getHackathonSubmissionThreads(hackathonId);
    },
    enabled: !!hackathonId,
  });
}

export function useInvalidateSubmissions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
    queryClient.invalidateQueries({ queryKey: ["submission"] });
    queryClient.invalidateQueries({ queryKey: ["submissions-hackathon"] });
    queryClient.invalidateQueries({ queryKey: ["submission-thread-me"] });
    queryClient.invalidateQueries({
      queryKey: ["submission-threads-hackathon"],
    });
  };
}

export type {
  Submission,
  SubmissionListItem,
  SubmissionThread,
  SubmissionThreadEntry,
};
