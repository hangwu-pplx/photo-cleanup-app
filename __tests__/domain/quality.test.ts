import { HeuristicQualityEngine } from '../../domain/quality/heuristic-quality-engine';
import { makePhoto, makeInput } from '../helpers';

const engine = new HeuristicQualityEngine();

describe('HeuristicQualityEngine', () => {
  it('scores higher resolution photos better when file sizes are proportional', () => {
    // Give the high-res photo a proportionally larger file size
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', width: 4000, height: 3000 }), fileSize: 6_000_000 }),
      makeInput({ asset: makePhoto({ id: 'b', width: 800, height: 600 }), fileSize: 300_000 }),
    ];
    const scores = engine.scorePhotos(inputs);
    expect(scores[0].overall).toBeGreaterThan(scores[1].overall);
    const resSignal = scores[0].signals.find(s => s.name === 'resolution');
    expect(resSignal?.value).toBe(1); // 12MP capped at 1.0
  });

  it('uses file size as sharpness proxy', () => {
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', width: 2000, height: 2000 }), fileSize: 8_000_000 }),
      makeInput({ asset: makePhoto({ id: 'b', width: 2000, height: 2000 }), fileSize: 200_000 }),
    ];
    const scores = engine.scorePhotos(inputs);
    const sharpA = scores[0].signals.find(s => s.name === 'sharpnessEstimate')!;
    const sharpB = scores[1].signals.find(s => s.name === 'sharpnessEstimate')!;
    expect(sharpA.value).toBeGreaterThan(sharpB.value);
  });

  it('detects portrait hints from filename', () => {
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a', filename: 'portrait_001.jpg' }) }),
      makeInput({ asset: makePhoto({ id: 'b', filename: 'landscape_001.jpg' }) }),
    ];
    const scores = engine.scorePhotos(inputs);
    const faceA = scores[0].signals.find(s => s.name === 'hasFace')!;
    const faceB = scores[1].signals.find(s => s.name === 'hasFace')!;
    expect(faceA.value).toBeGreaterThan(faceB.value);
  });

  it('produces scores between 0 and 1', () => {
    const inputs = [
      makeInput({ asset: makePhoto({ id: 'a' }) }),
      makeInput({ asset: makePhoto({ id: 'b', width: 100, height: 100 }), fileSize: 100 }),
      makeInput({ asset: makePhoto({ id: 'c', width: 8000, height: 6000 }), fileSize: 50_000_000 }),
    ];
    const scores = engine.scorePhotos(inputs);
    for (const score of scores) {
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
    }
  });
});
