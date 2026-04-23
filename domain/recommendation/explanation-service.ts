import { ClusterRecommendation, PhotoCluster, QualityScore } from '../../types';

export interface ExplanationService {
  explain(recommendation: ClusterRecommendation, cluster: PhotoCluster, scores: QualityScore[]): string;
}

export class SimpleExplanationService implements ExplanationService {
  explain(recommendation: ClusterRecommendation, cluster: PhotoCluster, scores: QualityScore[]): string {
    const parts: string[] = [];

    if (cluster.photos.length >= 2) {
      parts.push(`${cluster.photos.length} photos grouped`);
    }

    if (recommendation.state === 'recommended') {
      parts.push('A clear keeper was identified');
      if (recommendation.margin !== undefined) {
        parts.push(`Quality margin: ${(recommendation.margin * 100).toFixed(0)}%`);
      }
    } else if (recommendation.state === 'manual_review') {
      parts.push('Please review — the difference between top candidates is small');
    } else {
      parts.push('No strong recommendation — safe to skip');
    }

    return parts.join('. ') + '.';
  }
}
