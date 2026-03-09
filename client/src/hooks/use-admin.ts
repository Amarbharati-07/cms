import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Candidates
export function useAdminCandidates() {
  return useQuery({
    queryKey: [api.admin.candidates.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.candidates.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch candidates");
      return await res.json();
    }
  });
}

export function useAdminCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.candidates.create.path, {
        method: api.admin.candidates.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create candidate");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.candidates.list.path] })
  });
}

// Tasks
export function useAdminTasks() {
  return useQuery({
    queryKey: [api.admin.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return await res.json();
    }
  });
}

export function useAdminCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.admin.tasks.create.path, {
        method: api.admin.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.tasks.list.path] })
  });
}

export function useAdminReviewTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const url = buildUrl(api.admin.tasks.review.path, { id });
      const res = await fetch(url, {
        method: api.admin.tasks.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to review task");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admin.tasks.list.path] })
  });
}

// Attendance
export function useAdminAttendance() {
  return useQuery({
    queryKey: [api.admin.attendance.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.attendance.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return await res.json();
    }
  });
}
