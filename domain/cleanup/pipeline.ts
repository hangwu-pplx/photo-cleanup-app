import { PhotoAssetService } from '../photo/types';
import { SimilarityEngine } from '../similarity/types';
import { ClusteringEngine } from '../similarity/clustering-engine';
import { QualityEngine } from '../quality/types';
import { RecommendationService } from '../recommendation/types';
import { ExplanationService } from '../recommendation/explanation-service';
import { DeletionPlanner, DeleteService } from './types';
import {
  PhotoAsset,
  PhotoAnalysisInput,
  PhotoCluster,
  ClusterRecommendation,
  ProcessingState,
  DeletionPlan,
} from '../../types';
import { MAX_BATCH_SIZE } from '../../constants';

export interface PipelineConfig {
  assetService: PhotoAssetService;
  similarityEngine: SimilarityEngine;
  clusteringEngine: ClusteringEngine;
  qualityEngine: QualityEngine;
  recommendationService: RecommendationService;
  explanationService: ExplanationService;
  deletionPlanner: DeletionPlanner;
  deleteService: DeleteService;
}

export interface PipelineCallbacks {
  onStateChange: (state: ProcessingState) => void;
}

export interface PipelineResult {
  clusters: PhotoCluster[];
  recommendations: Record<string, ClusterRecommendation>;
  plan: DeletionPlan;
}

export class CleanupPipeline {
  constructor(private config: PipelineConfig) {}

  async run(selectedIds: string[], callbacks: PipelineCallbacks): Promise<PipelineResult> {
    const report = (stage: ProcessingState['stage'], progress: number, message: string) => {
      callbacks.onStateChange({
        stage,
        progress,
        totalPhotos: selectedIds.length,
        processedPhotos: Math.round(progress * selectedIds.length),
        message,
      });
    };

    try {
      // 1. Load assets
      report('loading_assets', 0.1, 'Loading photo metadata...');
      const { assets } = await this.config.assetService.getPhotoAssets({ first: MAX_BATCH_SIZE });
      const selectedAssets = assets.filter(a => selectedIds.includes(a.id));

      if (selectedAssets.length === 0) {
        throw new Error('No selected photos found');
      }

      // 2. Build analysis inputs
      report('analyzing', 0.2, 'Analyzing photos...');
      const inputs: PhotoAnalysisInput[] = [];
      for (let i = 0; i < selectedAssets.length; i++) {
        const input = await this.config.assetService.getPhotoAnalysisInput(selectedAssets[i]);
        inputs.push(input);
        report('analyzing', 0.2 + (0.2 * (i / selectedAssets.length)), `Analyzing ${i + 1} of ${selectedAssets.length}...`);
      }

      // 3. Generate similarity pairs
      report('generating_pairs', 0.4, 'Finding similar photos...');
      const pairs = this.config.similarityEngine.generatePairs(inputs);

      // 4. Cluster
      report('clustering', 0.6, 'Grouping photos...');
      const clusters = this.config.clusteringEngine.cluster(pairs, selectedAssets);

      // 5. Rank photos within clusters
      report('ranking', 0.7, 'Ranking photo quality...');
      const scores = this.config.qualityEngine.scorePhotos(inputs);
      const scoreMap = new Map(scores.map(s => [s.photo.id, s]));

      // 6. Build recommendations
      report('building_plan', 0.8, 'Building recommendations...');
      const recommendations: Record<string, ClusterRecommendation> = {};
      for (const cluster of clusters) {
        const clusterScores = cluster.photos
          .map(p => scoreMap.get(p.id))
          .filter((s): s is NonNullable<typeof s> => s !== undefined);
        recommendations[cluster.id] = this.config.recommendationService.recommend(cluster, clusterScores);
      }

      // 7. Build deletion plan
      report('building_plan', 0.9, 'Preparing deletion plan...');
      const plan = this.config.deletionPlanner.buildPlan(clusters, recommendations, {});

      report('complete', 1.0, 'Done!');

      return { clusters, recommendations, plan };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      callbacks.onStateChange({
        stage: 'error',
        progress: 0,
        totalPhotos: selectedIds.length,
        processedPhotos: 0,
        message: `Error: ${message}`,
        error: message,
      });
      throw error;
    }
  }
}
