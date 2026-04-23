import { SafeDeletionPlanner } from '../../domain/cleanup/deletion-planner';
import { makePhoto } from '../helpers';
import { PhotoCluster, ClusterRecommendation, DeletionPlan } from '../../types';

const planner = new SafeDeletionPlanner();

function now() {
  return Date.now();
}

describe('SafeDeletionPlanner', () => {
  it('builds empty plan for no clusters', () => {
    const plan = planner.buildPlan([], {}, {});
    expect(plan.items).toHaveLength(0);
    expect(plan.stats.totalPhotos).toBe(0);
    expect(plan.stats.toDelete).toBe(0);
  });

  it('marks non-recommended clusters for manual review', () => {
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
    const recs: Record<string, ClusterRecommendation> = {
      c1: {
        clusterId: 'c1',
        state: 'manual_review',
        recommendedKeepId: 'a',
        recommendedDeleteIds: ['b'],
        confidence: 0.5,
        reasons: ['Low confidence'],
      },
    };
    const plan = planner.buildPlan([cluster], recs, {});
    // In manual_review without override, the delete target goes to manual_review
    expect(plan.stats.manualReview).toBeGreaterThanOrEqual(1);
    expect(plan.stats.toDelete).toBe(0);
  });

  it('marks recommended clusters for deletion', () => {
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
    const recs: Record<string, ClusterRecommendation> = {
      c1: {
        clusterId: 'c1',
        state: 'recommended',
        recommendedKeepId: 'a',
        recommendedDeleteIds: ['b'],
        confidence: 0.9,
        reasons: ['Clear winner'],
      },
    };
    const plan = planner.buildPlan([cluster], recs, {});
    expect(plan.stats.toKeep).toBe(1);
    expect(plan.stats.toDelete).toBe(1);
    expect(plan.items.find(i => i.photoId === 'a')?.action).toBe('keep');
    expect(plan.items.find(i => i.photoId === 'b')?.action).toBe('delete');
  });

  it('respects user overrides', () => {
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
    const recs: Record<string, ClusterRecommendation> = {
      c1: {
        clusterId: 'c1',
        state: 'manual_review',
        recommendedKeepId: 'a',
        recommendedDeleteIds: ['b'],
        confidence: 0.5,
        reasons: ['Low confidence'],
      },
    };
    const overrides = {
      c1: { keepId: 'b' as string, deleteIds: ['a'] as string[] },
    };
    const plan = planner.buildPlan([cluster], recs, overrides);
    expect(plan.items.find(i => i.photoId === 'b')?.action).toBe('keep');
    expect(plan.items.find(i => i.photoId === 'a')?.action).toBe('delete');
  });

  it('does not delete when no recommendation exists', () => {
    const photos = [
      makePhoto({ id: 'a', creationTime: now() }),
      makePhoto({ id: 'b', creationTime: now() + 500 }),
    ];
    const cluster: PhotoCluster = {
      id: 'c1',
      photos,
      clusterType: 'similar',
      confidence: 0.3,
      reason: 'test',
    };
    const recs: Record<string, ClusterRecommendation> = {
      c1: {
        clusterId: 'c1',
        state: 'no_recommendation',
        recommendedDeleteIds: [],
        confidence: 0,
        reasons: ['Not enough photos'],
      },
    };
    const plan = planner.buildPlan([cluster], recs, {});
    expect(plan.stats.toDelete).toBe(0);
    expect(plan.stats.manualReview).toBe(2);
  });

  it('estimates space saved for deletions', () => {
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
    const recs: Record<string, ClusterRecommendation> = {
      c1: {
        clusterId: 'c1',
        state: 'recommended',
        recommendedKeepId: 'a',
        recommendedDeleteIds: ['b'],
        confidence: 0.9,
        reasons: ['Clear winner'],
      },
    };
    const plan = planner.buildPlan([cluster], recs, {});
    expect(plan.stats.estimatedSpaceSaved).toBeGreaterThan(0);
  });
});
