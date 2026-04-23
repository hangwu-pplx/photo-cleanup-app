import { UnionFindClusteringEngine } from '../../domain/similarity/clustering-engine';
import { makePhoto } from '../helpers';
import { SimilarityPair } from '../../types';

const engine = new UnionFindClusteringEngine();

function now() {
  return Date.now();
}

describe('UnionFindClusteringEngine', () => {
  it('returns no clusters for isolated photos', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now() }),
      makePhoto({ id: 'b', creationTime: now() + 100_000 }),
    ];
    const clusters = engine.cluster([], photos);
    expect(clusters).toHaveLength(0);
  });

  it('groups connected photos into one cluster', () => {
    const t = now();
    const photos = [
      makePhoto({ id: 'a', creationTime: t }),
      makePhoto({ id: 'b', creationTime: t + 200 }),
      makePhoto({ id: 'c', creationTime: t + 400 }),
    ];
    const pairs: SimilarityPair[] = [
      { photoA: photos[0], photoB: photos[1], score: 0.9, signals: [] },
      { photoB: photos[1], photoA: photos[2], score: 0.9, signals: [] },
    ];
    const clusters = engine.cluster(pairs, photos);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].photos).toHaveLength(3);
    expect(clusters[0].clusterType).toBe('duplicate');
  });

  it('creates separate clusters for disconnected groups', () => {
    const t = now();
    const photos = [
      makePhoto({ id: 'a', creationTime: t }),
      makePhoto({ id: 'b', creationTime: t + 500 }),
      makePhoto({ id: 'c', creationTime: t + 60_000 }),
      makePhoto({ id: 'd', creationTime: t + 60_500 }),
    ];
    const pairs: SimilarityPair[] = [
      { photoA: photos[0], photoB: photos[1], score: 0.9, signals: [] },
      { photoA: photos[2], photoB: photos[3], score: 0.9, signals: [] },
    ];
    const clusters = engine.cluster(pairs, photos);
    expect(clusters).toHaveLength(2);
  });

  it('does not create clusters with fewer than 2 photos', () => {
    const t = now();
    const photos = [
      makePhoto({ id: 'a', creationTime: t }),
      makePhoto({ id: 'b', creationTime: t + 500 }),
      makePhoto({ id: 'c', creationTime: t + 120_000 }),
    ];
    const pairs: SimilarityPair[] = [
      { photoA: photos[0], photoB: photos[1], score: 0.9, signals: [] },
    ];
    const clusters = engine.cluster(pairs, photos);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].photos).toHaveLength(2);
  });

  it('splits oversized clusters', () => {
    const t = now();
    const photos = Array.from({ length: 12 }, (_, i) =>
      makePhoto({ id: `p${i}`, creationTime: t + i * 100 })
    );
    const pairs: SimilarityPair[] = [];
    for (let i = 0; i < photos.length - 1; i++) {
      pairs.push({ photoA: photos[i], photoB: photos[i + 1], score: 0.9, signals: [] });
    }
    const clusters = engine.cluster(pairs, photos);
    // Should be split into chunks of max 8
    const totalInClusters = clusters.reduce((sum, c) => sum + c.photos.length, 0);
    expect(totalInClusters).toBe(12);
    for (const c of clusters) {
      expect(c.photos.length).toBeLessThanOrEqual(8);
      expect(c.photos.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('classifies burst vs duplicate vs similar correctly', () => {
    const t = now();
    const duplicatePhotos = [
      makePhoto({ id: 'a', creationTime: t }),
      makePhoto({ id: 'b', creationTime: t + 100 }),
    ];
    const burstPhotos = [
      makePhoto({ id: 'c', creationTime: t }),
      makePhoto({ id: 'd', creationTime: t + 1000 }),
    ];
    const similarPhotos = [
      makePhoto({ id: 'e', creationTime: t }),
      makePhoto({ id: 'f', creationTime: t + 5000 }),
    ];

    const dupCluster = engine.cluster(
      [{ photoA: duplicatePhotos[0], photoB: duplicatePhotos[1], score: 0.9, signals: [] }],
      duplicatePhotos
    );
    expect(dupCluster[0].clusterType).toBe('duplicate');

    const burstCluster = engine.cluster(
      [{ photoA: burstPhotos[0], photoB: burstPhotos[1], score: 0.9, signals: [] }],
      burstPhotos
    );
    expect(burstCluster[0].clusterType).toBe('burst');

    const similarCluster = engine.cluster(
      [{ photoA: similarPhotos[0], photoB: similarPhotos[1], score: 0.9, signals: [] }],
      similarPhotos
    );
    expect(similarCluster[0].clusterType).toBe('similar');
  });
});
