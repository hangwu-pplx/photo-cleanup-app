import { PhotoCluster, QualityScore, ClusterRecommendation } from '../../types';

export interface RecommendationService {
  recommend(cluster: PhotoCluster, scores: QualityScore[]): ClusterRecommendation;
}
