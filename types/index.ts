// Core photo asset representation (decoupled from expo-media-library)
export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number; // ms since epoch
  modificationTime: number;
  mediaType: 'photo';
  duration?: number;
}

// Analysis input derived from a photo (metadata + small thumbnail data)
export interface PhotoAnalysisInput {
  asset: PhotoAsset;
  thumbnailUri?: string;
  fileSize?: number;
  exif?: Record<string, any>;
}

// Similarity signal between two photos
export interface SimilarityPair {
  photoA: PhotoAsset;
  photoB: PhotoAsset;
  score: number; // 0-1
  signals: SimilaritySignal[];
}

export interface SimilaritySignal {
  name: string;
  weight: number;
  value: number; // 0-1
  description: string;
}

// Cluster of potentially duplicate/burst-like photos
export interface PhotoCluster {
  id: string;
  photos: PhotoAsset[];
  clusterType: 'duplicate' | 'burst' | 'similar';
  confidence: number; // 0-1
  reason: string;
}

// Quality assessment for a single photo
export interface QualityScore {
  photo: PhotoAsset;
  overall: number; // 0-1
  signals: QualitySignal[];
}

export interface QualitySignal {
  name: string;
  weight: number;
  value: number; // 0-1
  description: string;
}

// Recommendation state for a cluster
export type RecommendationState = 'recommended' | 'manual_review' | 'no_recommendation';

export interface ClusterRecommendation {
  clusterId: string;
  state: RecommendationState;
  recommendedKeepId?: string; // photo id to keep
  recommendedDeleteIds: string[]; // photos to delete
  confidence: number;
  reasons: string[];
  margin?: number; // difference between top and second-best quality
}

// Deletion plan entry
export interface DeletionPlanItem {
  photoId: string;
  clusterId: string;
  action: 'delete' | 'keep' | 'manual_review';
  reason: string;
}

export interface DeletionPlan {
  items: DeletionPlanItem[];
  stats: {
    totalPhotos: number;
    toDelete: number;
    toKeep: number;
    manualReview: number;
    estimatedSpaceSaved: number; // bytes
  };
}

// Review state for UI
export interface ReviewState {
  clusters: PhotoCluster[];
  recommendations: Record<string, ClusterRecommendation>;
  userOverrides: Record<string, { keepId: string; deleteIds: string[] }>;
  plan: DeletionPlan | null;
}

// App-level processing state
export type ProcessingStage =
  | 'idle'
  | 'loading_assets'
  | 'analyzing'
  | 'generating_pairs'
  | 'clustering'
  | 'ranking'
  | 'building_plan'
  | 'complete'
  | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number; // 0-1
  totalPhotos: number;
  processedPhotos: number;
  message: string;
  error?: string;
}
