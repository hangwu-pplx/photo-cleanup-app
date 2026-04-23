import { PhotoAsset, SimilarityPair, PhotoAnalysisInput } from '../../types';

export interface SimilarityEngine {
  generatePairs(inputs: PhotoAnalysisInput[]): SimilarityPair[];
}
