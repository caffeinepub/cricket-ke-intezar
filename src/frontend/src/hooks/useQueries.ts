import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TrendingItem } from "../backend.d";
import { useActor } from "./useActor";

export type { TrendingItem };

export function useGetTrendingItems() {
  const { actor, isFetching } = useActor();
  return useQuery<TrendingItem[]>({
    queryKey: ["trending-items"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingItems();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetItemsByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<TrendingItem[]>({
    queryKey: ["trending-items-category", category],
    queryFn: async () => {
      if (!actor) return [];
      if (category === "All") return actor.getTrendingItems();
      return actor.getItemsByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLikeItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.likeItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-items"] });
      queryClient.invalidateQueries({ queryKey: ["trending-items-category"] });
    },
  });
}

export function useIncrementViews() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.incrementViews(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-items"] });
      queryClient.invalidateQueries({ queryKey: ["trending-items-category"] });
    },
  });
}

export function useAddTrendingItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
    }: {
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTrendingItem(title, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-items"] });
      queryClient.invalidateQueries({ queryKey: ["trending-items-category"] });
    },
  });
}

export function useDeleteTrendingItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTrendingItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-items"] });
      queryClient.invalidateQueries({ queryKey: ["trending-items-category"] });
    },
  });
}
