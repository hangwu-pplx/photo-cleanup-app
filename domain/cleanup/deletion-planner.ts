import { DeletionPlanner } from './types';
import { DeletionPlan, DeletionPlanItem, ClusterRecommendation, PhotoCluster } from '../../types';

export class SafeDeletionPlanner implements DeletionPlanner {
  buildPlan(
    clusters: PhotoCluster[],
    recommendations: Record<string, ClusterRecommendation>,
    userOverrides: Record<string, { keepId: string; deleteIds: string[] }>
  ): DeletionPlan {
    const items: DeletionPlanItem[] = [];
    let toDelete = 0;
    let toKeep = 0;
    let manualReview = 0;
    let estimatedSpaceSaved = 0;

    for (const cluster of clusters) {
      const rec = recommendations[cluster.id];
      const override = userOverrides[cluster.id];

      if (!rec) continue;

      const keepId = override?.keepId ?? rec.recommendedKeepId;
      const deleteIds = override?.deleteIds ?? rec.recommendedDeleteIds;

      for (const photo of cluster.photos) {
        if (keepId === photo.id) {
          items.push({
            photoId: photo.id,
            clusterId: cluster.id,
            action: 'keep',
            reason: 'Selected to keep',
          });
          toKeep++;
        } else if (deleteIds?.includes(photo.id)) {
          // Only mark for deletion if recommendation is 'recommended' or user explicitly overrode
          if (rec.state === 'recommended' || override) {
            items.push({
              photoId: photo.id,
              clusterId: cluster.id,
              action: 'delete',
              reason: rec.reasons[0] ?? 'Marked for deletion',
            });
            toDelete++;
            // Rough estimate: assume 2MB per photo (will be refined with real file sizes)
            estimatedSpaceSaved += 2_000_000;
          } else {
            // manual_review state without override -> keep in manual review
            items.push({
              photoId: photo.id,
              clusterId: cluster.id,
              action: 'manual_review',
              reason: 'Needs your review before deletion',
            });
            manualReview++;
          }
        } else {
          // Photo not in keep or delete list
          items.push({
            photoId: photo.id,
            clusterId: cluster.id,
            action: 'manual_review',
            reason: 'Uncertain — please review',
          });
          manualReview++;
        }
      }
    }

    return {
      items,
      stats: {
        totalPhotos: items.length,
        toDelete,
        toKeep,
        manualReview,
        estimatedSpaceSaved,
      },
    };
  }
}
