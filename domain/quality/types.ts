import { PhotoAsset, QualityScore, PhotoAnalysisInput } from '../../types';

export interface QualityEngine {
  scorePhotos(inputs: PhotoAnalysisInput[]): QualityScore[];
}
