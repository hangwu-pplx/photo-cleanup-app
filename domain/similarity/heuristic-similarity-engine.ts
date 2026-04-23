import { SimilarityEngine } from './types';
import { PhotoAnalysisInput, SimilarityPair, SimilaritySignal } from '../../types';
import {
  BURST_TIME_WINDOW_MS,
  SIMILAR_TIME_WINDOW_MS,
  MIN_SIMILARITY_SCORE,
  SIMILARITY_WEIGHTS,
} from '../../constants';
import { weightedSum, clamp } from '../../lib/utils';

function computeTimeProximity(a: number, b: number): number {
  const diff = Math.abs(a - b);
  if (diff <= BURST_TIME_WINDOW_MS) return 1.0;
  if (diff <= SIMILAR_TIME_WINDOW_MS) {
    return clamp(1 - (diff - BURST_TIME_WINDOW_MS) / (SIMILAR_TIME_WINDOW_MS - BURST_TIME_WINDOW_MS), 0.5, 1);
  }
  return 0;
}

function computeSizeSimilarity(sizeA?: number, sizeB?: number): number {
  if (!sizeA || !sizeB || sizeA === 0 || sizeB === 0) return 0.5;
  const ratio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);
  return clamp(ratio, 0, 1);
}

function computeAspectRatioMatch(w1: number, h1: number, w2: number, h2: number): number {
  if (h1 === 0 || h2 === 0) return 0;
  const ar1 = w1 / h1;
  const ar2 = w2 / h2;
  const diff = Math.abs(ar1 - ar2);
  return clamp(1 - diff, 0, 1);
}

function computeFilenamePattern(a: string, b: string): number {
  // Common patterns: IMG_1234, burst_001, etc.
  const baseA = a.replace(/\.[^/.]+$/, '');
  const baseB = b.replace(/\.[^/.]+$/, '');

  // Exact match or one is prefix of other
  if (baseA === baseB) return 1.0;
  if (baseA.startsWith(baseB) || baseB.startsWith(baseA)) return 0.9;

  // Extract numeric sequences
  const numsA = baseA.match(/\d+/g) || [];
  const numsB = baseB.match(/\d+/g) || [];

  if (numsA.length > 0 && numsB.length > 0) {
    // Same prefix pattern with different numbers
    const prefixA = baseA.replace(/\d+/g, '#');
    const prefixB = baseB.replace(/\d+/g, '#');
    if (prefixA === prefixB) {
      // Check if numbers are close (burst sequence)
      const lastA = parseInt(numsA[numsA.length - 1], 10);
      const lastB = parseInt(numsB[numsB.length - 1], 10);
      const numDiff = Math.abs(lastA - lastB);
      if (numDiff <= 3) return 0.85;
      if (numDiff <= 10) return 0.7;
      return 0.5;
    }
  }

  // Same extension, different names
  return 0.3;
}

export class HeuristicSimilarityEngine implements SimilarityEngine {
  generatePairs(inputs: PhotoAnalysisInput[]): SimilarityPair[] {
    const pairs: SimilarityPair[] = [];

    // Sort by creation time for efficient windowing
    const sorted = [...inputs].sort((a, b) => a.asset.creationTime - b.asset.creationTime);

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];

        // Early exit if time window exceeded
        const timeDiff = Math.abs(b.asset.creationTime - a.asset.creationTime);
        if (timeDiff > SIMILAR_TIME_WINDOW_MS) break;

        const timeProximity = computeTimeProximity(a.asset.creationTime, b.asset.creationTime);
        const sizeSimilarity = computeSizeSimilarity(a.fileSize, b.fileSize);
        const aspectRatioMatch = computeAspectRatioMatch(
          a.asset.width, a.asset.height,
          b.asset.width, b.asset.height
        );
        const filenamePattern = computeFilenamePattern(a.asset.filename, b.asset.filename);

        const signals: SimilaritySignal[] = [
          { name: 'timeProximity', weight: SIMILARITY_WEIGHTS.timeProximity, value: timeProximity, description: 'Photos taken close together in time' },
          { name: 'sizeSimilarity', weight: SIMILARITY_WEIGHTS.sizeSimilarity, value: sizeSimilarity, description: 'Similar file sizes' },
          { name: 'aspectRatioMatch', weight: SIMILARITY_WEIGHTS.aspectRatioMatch, value: aspectRatioMatch, description: 'Same aspect ratio' },
          { name: 'filenamePattern', weight: SIMILARITY_WEIGHTS.filenamePattern, value: filenamePattern, description: 'Similar filename pattern (burst/sequence)' },
        ];

        const score = weightedSum(signals);

        if (score >= MIN_SIMILARITY_SCORE) {
          pairs.push({
            photoA: a.asset,
            photoB: b.asset,
            score,
            signals,
          });
        }
      }
    }

    return pairs;
  }
}
