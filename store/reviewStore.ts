import { create } from 'zustand';
import { DeletionPlan, ClusterRecommendation, PhotoCluster } from '../types';

interface ReviewStoreState {
  clusters: PhotoCluster[];
  recommendations: Record<string, ClusterRecommendation>;
  userOverrides: Record<string, { keepId: string; deleteIds: string[] }>;
  plan: DeletionPlan | null;
  setReviewData: (data: {
    clusters: PhotoCluster[];
    recommendations: Record<string, ClusterRecommendation>;
    plan: DeletionPlan;
  }) => void;
  overrideCluster: (clusterId: string, keepId: string, deleteIds: string[]) => void;
  clearOverrides: () => void;
  getEffectiveRecommendation: (clusterId: string) => ClusterRecommendation | undefined;
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  clusters: [],
  recommendations: {},
  userOverrides: {},
  plan: null,

  setReviewData: (data) =>
    set({
      clusters: data.clusters,
      recommendations: data.recommendations,
      plan: data.plan,
    }),

  overrideCluster: (clusterId: string, keepId: string, deleteIds: string[]) =>
    set(state => ({
      userOverrides: {
        ...state.userOverrides,
        [clusterId]: { keepId, deleteIds },
      },
    })),

  clearOverrides: () => set({ userOverrides: {} }),

  getEffectiveRecommendation: (clusterId: string) => {
    const state = get();
    const rec = state.recommendations[clusterId];
    const override = state.userOverrides[clusterId];
    if (!rec) return undefined;
    if (!override) return rec;
    return {
      ...rec,
      recommendedKeepId: override.keepId,
      recommendedDeleteIds: override.deleteIds,
      state: 'recommended' as const,
    };
  },
}));
