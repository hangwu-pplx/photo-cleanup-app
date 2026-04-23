import { PhotoAsset, SimilarityPair, PhotoCluster } from '../../types';
import { MIN_CLUSTER_SIZE, MAX_CLUSTER_SIZE } from '../../constants';
import { generateId } from '../../lib/utils';

export interface ClusteringEngine {
  cluster(pairs: SimilarityPair[], allPhotos: PhotoAsset[]): PhotoCluster[];
}

export class UnionFindClusteringEngine implements ClusteringEngine {
  cluster(pairs: SimilarityPair[], allPhotos: PhotoAsset[]): PhotoCluster[] {
    // Build union-find structure
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();

    function find(id: string): string {
      if (parent.get(id) !== id) {
        parent.set(id, find(parent.get(id)!));
      }
      return parent.get(id)!;
    }

    function union(a: string, b: string): void {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA === rootB) return;

      const rankA = rank.get(rootA) || 0;
      const rankB = rank.get(rootB) || 0;

      if (rankA > rankB) {
        parent.set(rootB, rootA);
      } else if (rankA < rankB) {
        parent.set(rootA, rootB);
      } else {
        parent.set(rootB, rootA);
        rank.set(rootA, rankA + 1);
      }
    }

    // Initialize all photos
    for (const photo of allPhotos) {
      parent.set(photo.id, photo.id);
      rank.set(photo.id, 0);
    }

    // Union connected pairs
    for (const pair of pairs) {
      union(pair.photoA.id, pair.photoB.id);
    }

    // Group by root
    const groups = new Map<string, PhotoAsset[]>();
    for (const photo of allPhotos) {
      const root = find(photo.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(photo);
    }

    // Build clusters
    const clusters: PhotoCluster[] = [];

    for (const [_, photos] of groups) {
      if (photos.length < MIN_CLUSTER_SIZE) continue;

      // Determine cluster type based on time spread
      const times = photos.map(p => p.creationTime).sort((a, b) => a - b);
      const timeSpread = times[times.length - 1] - times[0];
      const avgInterval = timeSpread / (photos.length - 1);

      let clusterType: PhotoCluster['clusterType'];
      if (avgInterval < 500) {
        clusterType = 'duplicate';
      } else if (avgInterval < 2000) {
        clusterType = 'burst';
      } else {
        clusterType = 'similar';
      }

      // Confidence based on cluster size and time coherence
      const sizeScore = Math.min(photos.length / 5, 1);
      const timeScore = timeSpread < 10000 ? 1 : timeSpread < 60000 ? 0.7 : 0.4;
      const confidence = (sizeScore + timeScore) / 2;

      // Build reason
      const reasons: string[] = [];
      if (clusterType === 'duplicate') {
        reasons.push(`${photos.length} photos taken within ${Math.round(timeSpread / 1000)}s — likely duplicates`);
      } else if (clusterType === 'burst') {
        reasons.push(`${photos.length} burst-like shots within ${Math.round(timeSpread / 1000)}s`);
      } else {
        reasons.push(`${photos.length} similar photos within ${Math.round(timeSpread / 1000)}s`);
      }

      // Split oversized clusters
      if (photos.length > MAX_CLUSTER_SIZE) {
        const chunks: PhotoAsset[][] = [];
        for (let i = 0; i < photos.length; i += MAX_CLUSTER_SIZE) {
          chunks.push(photos.slice(i, i + MAX_CLUSTER_SIZE));
        }
        for (const chunk of chunks) {
          if (chunk.length >= MIN_CLUSTER_SIZE) {
            clusters.push({
              id: generateId(),
              photos: chunk,
              clusterType,
              confidence,
              reason: reasons[0],
            });
          }
        }
      } else {
        clusters.push({
          id: generateId(),
          photos,
          clusterType,
          confidence,
          reason: reasons[0],
        });
      }
    }

    return clusters;
  }
}
