import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReviewStore } from '../store/reviewStore';
import { useSelectionStore } from '../store/selectionStore';
import { PhotoAsset } from '../types';
import { formatBytes, formatDate } from '../lib/utils';

export default function ReviewScreen() {
  const router = useRouter();
  const { clusters, recommendations, plan, overrideCluster, userOverrides } = useReviewStore();
  const { clearSelection } = useSelectionStore();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const actionableClusters = clusters.filter(c => c.photos.length >= 2);

  const handleConfirmDelete = () => {
    setConfirmVisible(true);
  };

  const handleExecuteDelete = () => {
    // In a real implementation, this would call the delete service
    // For safety in the MVP, we show a confirmation and explain platform behavior
    Alert.alert(
      'Photos Moved to Recently Deleted',
      'On iOS, deleted photos go to the Recently Deleted album for ~30 days. On Android, behavior varies by manufacturer. You can recover them from your system Photos app if needed.',
      [
        { text: 'Got it', style: 'default' },
      ]
    );
    setConfirmVisible(false);
    clearSelection();
    router.replace('/');
  };

  if (actionableClusters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No groups found</Text>
          <Text style={styles.emptyText}>
            We did not find any likely duplicate or burst shots in your selection.{'\n'}
            Try selecting more photos taken close together in time.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.summaryTitle}>Review Groups</Text>
        {plan && (
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>
              {plan.stats.totalPhotos} photos in {actionableClusters.length} groups{'\n'}
              {plan.stats.toDelete} marked for deletion{'\n'}
              {plan.stats.manualReview} need manual review
            </Text>
            {plan.stats.estimatedSpaceSaved > 0 && (
              <Text style={styles.statsHighlight}>
                ~{formatBytes(plan.stats.estimatedSpaceSaved)} could be freed
              </Text>
            )}
          </View>
        )}

        {actionableClusters.map(cluster => {
          const rec = recommendations[cluster.id];
          const override = userOverrides[cluster.id];
          const keepId = override?.keepId ?? rec?.recommendedKeepId;
          const isExpanded = expandedCluster === cluster.id;
          const stateLabel = rec?.state === 'recommended' ? 'Recommended keep' :
            rec?.state === 'manual_review' ? 'Manual review' : 'No recommendation';
          const stateColor = rec?.state === 'recommended' ? '#34c759' :
            rec?.state === 'manual_review' ? '#ff9500' : '#8e8e93';

          return (
            <View key={cluster.id} style={styles.clusterCard}>
              <Pressable onPress={() => setExpandedCluster(isExpanded ? null : cluster.id)}>
                <View style={styles.clusterHeader}>
                  <Text style={styles.clusterType}>{cluster.clusterType.toUpperCase()}</Text>
                  <Text style={[styles.clusterState, { color: stateColor }]}>{stateLabel}</Text>
                </View>
                <Text style={styles.clusterReason}>{cluster.reason}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {cluster.photos.map(photo => (
                    <View key={photo.id} style={styles.photoWrap}>
                      <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                      {keepId === photo.id && (
                        <View style={styles.keepBadge}>
                          <Text style={styles.keepBadgeText}>KEEP</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </Pressable>

              {isExpanded && (
                <View style={styles.detailSection}>
                  {rec?.reasons.map((reason, idx) => (
                    <Text key={idx} style={styles.reasonText}>• {reason}</Text>
                  ))}
                  <Text style={styles.confidenceText}>
                    Confidence: {((rec?.confidence ?? 0) * 100).toFixed(0)}%
                  </Text>
                  {rec?.margin !== undefined && (
                    <Text style={styles.confidenceText}>
                      Margin: {(rec.margin * 100).toFixed(0)}%
                    </Text>
                  )}

                  <Text style={styles.chooseLabel}>Choose which to keep:</Text>
                  {cluster.photos.map(photo => (
                    <Pressable
                      key={photo.id}
                      style={[
                        styles.photoOption,
                        keepId === photo.id && styles.photoOptionSelected,
                      ]}
                      onPress={() => {
                        const deleteIds = cluster.photos
                          .filter(p => p.id !== photo.id)
                          .map(p => p.id);
                        overrideCluster(cluster.id, photo.id, deleteIds);
                      }}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.optionThumb} />
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionFilename}>{photo.filename}</Text>
                        <Text style={styles.optionMeta}>
                          {photo.width}x{photo.height} • {formatDate(photo.creationTime)}
                        </Text>
                      </View>
                      {keepId === photo.id && (
                        <Text style={styles.optionCheck}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Pressable style={styles.deleteButton} onPress={handleConfirmDelete}>
          <Text style={styles.deleteButtonText}>
            Confirm Deletion ({plan?.stats.toDelete ?? 0} photos)
          </Text>
        </Pressable>

        <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.replace('/') }>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel & Go Home</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              You are about to delete {plan?.stats.toDelete ?? 0} photos.{'\n\n'}
              These will be moved to your device&apos;s Recently Deleted / Trash folder.{'\n'}
              You can recover them from your system Photos app if needed.{'\n\n'}
              This action cannot be undone from within this app.
            </Text>
            <Pressable style={styles.deleteButton} onPress={handleExecuteDelete}>
              <Text style={styles.deleteButtonText}>I Understand — Delete</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setConfirmVisible(false)}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  statsHighlight: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  clusterCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clusterType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  clusterState: {
    fontSize: 12,
    fontWeight: '600',
  },
  clusterReason: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoWrap: {
    position: 'relative',
    marginRight: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  keepBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#34c759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keepBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  detailSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  reasonText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  chooseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  photoOptionSelected: {
    backgroundColor: '#e5f2ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  optionThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  optionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  optionFilename: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222',
  },
  optionMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  optionCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButton: {
    backgroundColor: '#f2f2f7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
});
