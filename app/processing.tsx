import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelectionStore } from '../store/selectionStore';
import { useProcessingStore } from '../store/processingStore';
import { useReviewStore } from '../store/reviewStore';
import { CleanupPipeline } from '../domain/cleanup/pipeline';
import { ExpoPhotoAssetService } from '../domain/photo/expo-asset-service';
import { HeuristicSimilarityEngine } from '../domain/similarity/heuristic-similarity-engine';
import { UnionFindClusteringEngine } from '../domain/similarity/clustering-engine';
import { HeuristicQualityEngine } from '../domain/quality/heuristic-quality-engine';
import { ConservativeRecommendationService } from '../domain/recommendation/conservative-recommendation-service';
import { SimpleExplanationService } from '../domain/recommendation/explanation-service';
import { SafeDeletionPlanner } from '../domain/cleanup/deletion-planner';
import { ExpoDeleteService } from '../domain/cleanup/expo-delete-service';

const assetService = new ExpoPhotoAssetService();
const pipeline = new CleanupPipeline({
  assetService,
  similarityEngine: new HeuristicSimilarityEngine(),
  clusteringEngine: new UnionFindClusteringEngine(),
  qualityEngine: new HeuristicQualityEngine(),
  recommendationService: new ConservativeRecommendationService(),
  explanationService: new SimpleExplanationService(),
  deletionPlanner: new SafeDeletionPlanner(),
  deleteService: new ExpoDeleteService(assetService),
});

export default function ProcessingScreen() {
  const router = useRouter();
  const { selectedIds } = useSelectionStore();
  const { state, setState, setResult } = useProcessingStore();
  const { setReviewData } = useReviewStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const ids = Array.from(selectedIds);
    pipeline
      .run(ids, {
        onStateChange: setState,
      })
      .then(result => {
        setResult(result);
        setReviewData(result);
        router.replace('/review');
      })
      .catch(() => {
        // Error state already set by pipeline
      });
  }, [selectedIds, setState, setResult, setReviewData, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>{state.message || 'Starting...'}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${state.progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {state.processedPhotos} / {state.totalPhotos}
        </Text>
        {state.stage === 'error' && (
          <Text style={styles.error}>{state.error || 'An error occurred'}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#e5e5ea',
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 10,
    fontSize: 13,
    color: '#888',
  },
  error: {
    marginTop: 20,
    fontSize: 15,
    color: '#ff3b30',
    textAlign: 'center',
  },
});
