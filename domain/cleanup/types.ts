import { DeletionPlan, ClusterRecommendation, PhotoCluster } from '../../types';

export interface DeletionPlanner {
  buildPlan(
    clusters: PhotoCluster[],
    recommendations: Record<string, ClusterRecommendation>,
    userOverrides: Record<string, { keepId: string; deleteIds: string[] }>
  ): DeletionPlan;
}

export interface DeleteService {
  executePlan(plan: DeletionPlan): Promise<{ success: string[]; failed: string[] }>;
}
