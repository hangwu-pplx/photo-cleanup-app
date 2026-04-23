import { ConservativeRecommendationService } from '../../domain/recommendation/conservative-recommendation-service';
import { makePhoto } from '../helpers';
import { PhotoCluster, QualityScore } from '../../types';

const service = new ConservativeRecommendationService();

function now() {
  return Date.now();
}

describe('ConservativeRecommendationService', () => {
  it('returns no_recommendation for single-photo cluster', () => {
    const cluster: PhotoCluster = {
      id: 'c1',
      photos: [makePhoto({ id: 'a', creationTime: now() })],
      clusterType: 'similar',
      confidence: 0.9,
      reason: 'test',
    };
    const rec = service.recommend(cluster, []);
    expect(rec.state).toBe('no_recommendation');
    expect(rec.recommendedDeleteIds).toHaveLength(0);
  });

  it('recommends keeping highest quality photo with sufficient margin', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now(), width: 4000, height: 3000 }),
      makePhoto({ id: 'b', creationTime: now() + 500, width: 800, height: 600 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'duplicate',
      confidence: 0.9,
      reason: 'test',
    };
    const scores: QualityScore[] = [
      { photo: photos[0], overall: 0.9, signals: [] },
      { photo: photos[1], overall: 0.5, signals: [] },
    ];
    const rec = service.recommend(cluster, scores);
    expect(rec.state).toBe('recommended');
    expect(rec.recommendedKeepId).toBe('a');
    expect(rec.recommendedDeleteIds).toContain('b');
    expect(rec.margin).toBeCloseTo(0.4, 5);
  });

  it('suggests manual_review when margin is too small', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now() }),
      makePhoto({ id: 'b', creationTime: now() + 500 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'duplicate',
      confidence: 0.9,
      reason: 'test',
    };
    const scores: QualityScore[] = [
      { photo: photos[0], overall: 0.75, signals: [] },
      { photo: photos[1], overall: 0.70, signals: [] },
    ];
    const rec = service.recommend(cluster, scores);
    expect(rec.state).toBe('manual_review');
    expect(rec.recommendedKeepId).toBe('a'); // still suggests best
    expect(rec.margin).toBeCloseTo(0.05, 5);
    expect(rec.reasons.some(r => r.includes('small'))).toBe(true);
  });

  it('suggests manual_review when confidence is low', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now() }),
      makePhoto({ id: 'b', creationTime: now() + 500 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'similar',
      confidence: 0.5,
      reason: 'test',
    };
    const scores: QualityScore[] = [
      { photo: photos[0], overall: 0.9, signals: [] },
      { photo: photos[1], overall: 0.5, signals: [] },
    ];
    const rec = service.recommend(cluster, scores);
    expect(rec.state).toBe('manual_review');
    expect(rec.reasons.some(r => r.includes('low'))).toBe(true);
  });

  it('includes reasons for recommendation', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now(), filename: 'portrait.jpg' }),
      makePhoto({ id: 'b', creationTime: now() + 500 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'burst',
      confidence: 0.9,
      reason: 'Burst sequence',
    };
    const scores: QualityScore[] = [
      {
        photo: photos[0],
        overall: 0.9,
        signals: [
          { name: 'resolution', weight: 0.25, value: 0.9, description: '4000x3000' },
          { name: 'hasFace', weight: 0.15, value: 0.9, description: 'possible portrait' },
        ],
      },
      { photo: photos[1], overall: 0.5, signals: [] },
    ];
    const rec = service.recommend(cluster, scores);
    expect(rec.reasons.length).toBeGreaterThan(0);
    expect(rec.reasons.some(r => r.includes('Burst'))).toBe(true);
  });

  it('handles three+ photo clusters', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now() }),
      makePhoto({ id: 'b', creationTime: now() + 200 }),
      makePhoto({ id: 'c', creationTime: now() + 400 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'duplicate',
      confidence: 0.9,
      reason: 'test',
    };
    const scores: QualityScore[] = [
      { photo: photos[0], overall: 0.9, signals: [] },
      { photo: photos[1], overall: 0.7, signals: [] },
      { photo: photos[2], overall: 0.5, signals: [] },
    ];
    const rec = service.recommend(cluster, scores);
    expect(rec.state).toBe('recommended');
    expect(rec.recommendedKeepId).toBe('a');
    expect(rec.recommendedDeleteIds).toEqual(['b', 'c']);
  });
});
