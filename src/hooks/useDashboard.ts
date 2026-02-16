import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/api/dashboard";
import type { DashboardStats } from "@/types/dashboard.type";

export const keys = {
  all: ["dashboard"] as const,
  stats: () => [...keys.all, "stats"] as const,
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: keys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const response = await getDashboardStats();
      return response as unknown as DashboardStats;
    },
  });
}
