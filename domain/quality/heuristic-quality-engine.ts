import { QualityEngine } from './types';
import { PhotoAnalysisInput, QualityScore, QualitySignal } from '../../types';
import { QUALITY_WEIGHTS } from '../../constants';
import { weightedSum, clamp } from '../../lib/utils';

export class HeuristicQualityEngine implements QualityEngine {
  scorePhotos(inputs: PhotoAnalysisInput[]): QualityScore[] {
    return inputs.map(input => this.scorePhoto(input));
  }

  private scorePhoto(input: PhotoAnalysisInput): QualityScore {
    const { asset, fileSize } = input;

    // Resolution score: higher resolution = better (up to a point)
    const megapixels = (asset.width * asset.height) / 1_000_000;
    const resolution = clamp(megapixels / 12, 0, 1); // cap at 12MP

    // Sharpness estimate: use file size as proxy (larger = more detail, up to a point)
    let sharpnessEstimate = 0.5;
    if (fileSize) {
      const bytesPerPixel = fileSize / (asset.width * asset.height);
      sharpnessEstimate = clamp(bytesPerPixel / 2, 0, 1); // normalize
    }

    // Exposure balance: prefer mid-tones (proxy: not too dark, not too bright)
    // Without actual pixel data, we use a neutral score with slight preference for larger files
    let exposureBalance = 0.6;
    if (fileSize) {
      // Very small files might be underexposed or overexposed (compressed)
      const bytesPerPixel = fileSize / (asset.width * asset.height);
      if (bytesPerPixel < 0.3) exposureBalance = 0.4;
      else if (bytesPerPixel > 1.5) exposureBalance = 0.8;
      else exposureBalance = 0.7;
    }

    // File size score: prefer well-sized files (not too small, not excessively large)
    let fileSizeScore = 0.5;
    if (fileSize) {
      const mp = asset.width * asset.height / 1_000_000;
      const expectedSize = mp * 0.5 * 1_000_000; // rough heuristic: 0.5MB per MP
      const ratio = fileSize / expectedSize;
      if (ratio >= 0.5 && ratio <= 3) fileSizeScore = 0.9;
      else if (ratio < 0.5) fileSizeScore = 0.4;
      else fileSizeScore = 0.6;
    }

    // Face detection proxy: use filename hints or EXIF if available
    let hasFace = 0.5;
    const lowerName = asset.filename.toLowerCase();
    if (lowerName.includes('portrait') || lowerName.includes('face')) {
      hasFace = 0.9;
    }
    // In a real implementation, we'd use face detection ML

    const signals: QualitySignal[] = [
      { name: 'resolution', weight: QUALITY_WEIGHTS.resolution, value: resolution, description: `${asset.width}x${asset.height}` },
      { name: 'sharpnessEstimate', weight: QUALITY_WEIGHTS.sharpnessEstimate, value: sharpnessEstimate, description: fileSize ? `~${(fileSize / (asset.width * asset.height)).toFixed(2)} B/px` : 'unknown' },
      { name: 'exposureBalance', weight: QUALITY_WEIGHTS.exposureBalance, value: exposureBalance, description: exposureBalance > 0.6 ? 'likely well-exposed' : 'may need review' },
      { name: 'fileSize', weight: QUALITY_WEIGHTS.fileSize, value: fileSizeScore, description: fileSize ? `${(fileSize / 1_000_000).toFixed(1)} MB` : 'unknown' },
      { name: 'hasFace', weight: QUALITY_WEIGHTS.hasFace, value: hasFace, description: hasFace > 0.5 ? 'possible portrait' : 'no face data' },
    ];

    const overall = weightedSum(signals);

    return {
      photo: asset,
      overall,
      signals,
    };
  }
}
