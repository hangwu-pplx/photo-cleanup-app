import { RecommendationService } from './types';
import { PhotoCluster, QualityScore, ClusterRecommendation, RecommendationState } from '../../types';
import { MIN_RECOMMENDATION_CONFIDENCE, MIN_RECOMMENDATION_MARGIN } from '../../constants';

export class ConservativeRecommendationService implements RecommendationService {
  recommend(cluster: PhotoCluster, scores: QualityScore[]): ClusterRecommendation {
    // Only clusters with 2+ photos are actionable
    if (cluster.photos.length < 2) {
      return {
        clusterId: cluster.id,
        state: 'no_recommendation',
        recommendedDeleteIds: [],
        confidence: 0,
        reasons: ['Not enough photos to compare'],
      };
    }

    // Map scores by photo id
    const scoreMap = new Map(scores.map(s => [s.photo.id, s]));

    // Rank photos by quality
    const ranked = [...cluster.photos]
      .map(p => ({ photo: p, score: scoreMap.get(p.id)?.overall ?? 0.5 }))
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      return {
        clusterId: cluster.id,
        state: 'no_recommendation',
        recommendedDeleteIds: [],
        confidence: 0,
        reasons: ['Could not assess photo quality'],
      };
    }

    const best = ranked[0];
    const secondBest = ranked[1];
    const margin = secondBest ? best.score - secondBest.score : 1;

    // Build reasons
    const reasons: string[] = [];
    const bestScore = scoreMap.get(best.photo.id);

    if (bestScore) {
      const topSignals = bestScore.signals
        .filter(s => s.value > 0.7)
        .map(s => s.description);
      if (topSignals.length > 0) {
        reasons.push(`Recommended keep: ${topSignals.slice(0, 2).join(', ')}`);
      }
    }

    if (cluster.clusterType === 'duplicate') {
      reasons.push('These photos appear very similar — one should be enough');
    } else if (cluster.clusterType === 'burst') {
      reasons.push('Burst sequence detected — keeping the clearest shot');
    } else {
      reasons.push('Similar photos detected — keeping the best quality one');
    }

    // Conservative decision logic
    const baseConfidence = cluster.confidence * (best.score > 0 ? best.score : 0.5);

    if (baseConfidence >= MIN_RECOMMENDATION_CONFIDENCE && margin >= MIN_RECOMMENDATION_MARGIN) {
      const deleteIds = ranked.slice(1).map(r => r.photo.id);
      return {
        clusterId: cluster.id,
        state: 'recommended',
        recommendedKeepId: best.photo.id,
        recommendedDeleteIds: deleteIds,
        confidence: baseConfidence,
        reasons,
        margin,
      };
    }

    // Low confidence or low margin -> manual review
    if (margin < MIN_RECOMMENDATION_MARGIN) {
      reasons.push('Quality difference between top photos is small — please review');
    }
    if (baseConfidence < MIN_RECOMMENDATION_CONFIDENCE) {
      reasons.push('Overall confidence is low — please review');
    }

    return {
      clusterId: cluster.id,
      state: 'manual_review',
      recommendedKeepId: best.photo.id, // still suggest best, but don't auto-delete
      recommendedDeleteIds: ranked.slice(1).map(r => r.photo.id),
      confidence: baseConfidence,
      reasons,
      margin,
    };
  }
}
