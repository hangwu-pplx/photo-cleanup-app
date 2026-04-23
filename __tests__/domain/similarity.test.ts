import { HeuristicSimilarityEngine } from '../../domain/similarity/heuristic-similarity-engine';
import { makePhoto, makeInput } from '../helpers';

const engine = new HeuristicSimilarityEngine();

function now() {
  return Date.now();
}

describe('HeuristicSimilarityEngine', () => {
  it('returns empty pairs for a single photo', () => {
    const inputs = [makeInput({ asset: makePhoto({ id: 'a', creationTime: now() }) })];
    const pairs = engine.generatePairs(inputs);
    expect(pairs).toHaveLength(0);
  });

  it('pairs photos taken within burst window', () => {
    const t = now();
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', creationTime: t, filename: 'IMG_0001.jpg' }) }),
      makeInput({ asset: makePhoto({ id: 'b', creationTime: t + 500, filename: 'IMG_0002.jpg' }) }),
    ];
    const pairs = engine.generatePairs(inputs);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0].score).toBeGreaterThan(0.7);
  });

  it('does not pair photos far apart in time', () => {
    const t = now();
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', creationTime: t }) }),
      makeInput({ asset: makePhoto({ id: 'b', creationTime: t + 120_000 }) }),
    ];
    const pairs = engine.generatePairs(inputs);
    expect(pairs).toHaveLength(0);
  });

  it('gives higher score for burst filenames', () => {
    const t = now();
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', creationTime: t, filename: 'burst_001.jpg' }) }),
      makeInput({ asset: makePhoto({ id: 'b', creationTime: t + 800, filename: 'burst_002.jpg' }) }),
    ];
    const pairs = engine.generatePairs(inputs);
    expect(pairs.length).toBeGreaterThan(0);
    const pair = pairs[0];
    const filenameSignal = pair.signals.find(s => s.name === 'filenamePattern');
    expect(filenameSignal?.value).toBeGreaterThan(0.8);
  });

  it('gives lower score for different aspect ratios', () => {
    const t = now();
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', creationTime: t, width: 1200, height: 1600 }) }),
      makeInput({ asset: makePhoto({ id: 'b', creationTime: t + 500, width: 1920, height: 1080 }) }),
    ];
    const pairs = engine.generatePairs(inputs);
    if (pairs.length > 0) {
      const arSignal = pairs[0].signals.find(s => s.name === 'aspectRatioMatch');
      expect(arSignal?.value).toBeLessThan(0.5);
    }
  });

  it('respects minimum similarity threshold', () => {
    const t = now();
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', creationTime: t, width: 100, height: 100, filename: 'a.jpg' }) }),
      makeInput({ asset: makePhoto({ id: 'b', creationTime: t + 25_000, width: 4000, height: 3000, filename: 'z.png' }) }),
    ];
    const pairs = engine.generatePairs(inputs);
    // Either no pairs, or score below threshold
    for (const pair of pairs) {
      expect(pair.score).toBeGreaterThanOrEqual(0.6);
    }
  });
});
