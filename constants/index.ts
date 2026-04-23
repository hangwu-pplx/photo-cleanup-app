// Time window for considering photos as burst/duplicate candidates (in ms)
export const BURST_TIME_WINDOW_MS = 3000; // 3 seconds
export const SIMILAR_TIME_WINDOW_MS = 30000; // 30 seconds

// Minimum similarity score to consider a pair
export const MIN_SIMILARITY_SCORE = 0.6;

// Minimum confidence to auto-recommend (below this = manual review)
export const MIN_RECOMMENDATION_CONFIDENCE = 0.75;

// Minimum margin between top and second-best to make a recommendation
export const MIN_RECOMMENDATION_MARGIN = 0.15;

// Maximum photos to process in one batch
export const MAX_BATCH_SIZE = 50;

// Minimum cluster size to be actionable
export const MIN_CLUSTER_SIZE = 2;

// Maximum cluster size before we split
export const MAX_CLUSTER_SIZE = 8;

// Quality signal weights (must sum to 1)
export const QUALITY_WEIGHTS = {
  resolution: 0.25,
  sharpnessEstimate: 0.25,
  exposureBalance: 0.20,
  fileSize: 0.15,
  hasFace: 0.15,
} as const;

// Similarity signal weights (must sum to 1)
export const SIMILARITY_WEIGHTS = {
  timeProximity: 0.35,
  sizeSimilarity: 0.20,
  aspectRatioMatch: 0.20,
  filenamePattern: 0.25,
} as const;
