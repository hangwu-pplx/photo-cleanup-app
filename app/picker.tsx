import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelectionStore } from '../store/selectionStore';
import { ExpoPhotoAssetService } from '../domain/photo/expo-asset-service';
import { PhotoAsset } from '../types';

const BATCH_SIZE = 50;
const assetService = new ExpoPhotoAssetService();

export default function PickerScreen() {
  const router = useRouter();
  const { selectedIds, toggleSelection, setPhotos, clearSelection, isSelected } = useSelectionStore();
  const [assets, setAssets] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  const loadPhotos = useCallback(async (after?: string) => {
    const hasPermission = await assetService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please allow access to photos.');
      setLoading(false);
      return;
    }

    const result = await assetService.getPhotoAssets({ first: BATCH_SIZE, after });
    setAssets(prev => (after ? [...prev, ...result.assets] : result.assets));
    setHasMore(result.hasNextPage);
    setCursor(result.endCursor);
    setPhotos(result.assets);
    setLoading(false);
  }, [setPhotos]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleNext = () => {
    if (selectedIds.size < 2) {
      Alert.alert('Select More Photos', 'Please select at least 2 photos to analyze.');
      return;
    }
    if (selectedIds.size > 50) {
      Alert.alert('Too Many Photos', 'Please select 50 or fewer photos for this batch.');
      return;
    }
    router.push('/processing');
  };

  const renderItem = ({ item }: { item: PhotoAsset }) => {
    const selected = isSelected(item.id);
    return (
      <Pressable
        style={[styles.thumbnailContainer, selected && styles.selectedContainer]}
        onPress={() => toggleSelection(item.id)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {selectedIds.size} selected
        </Text>
        <Pressable onPress={clearSelection}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      {loading && assets.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          onEndReached={() => {
            if (hasMore && cursor) loadPhotos(cursor);
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, selectedIds.size < 2 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedIds.size < 2}
        >
          <Text style={styles.buttonText}>
            Analyze {selectedIds.size} Photos
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 15,
    color: '#007AFF',
  },
  grid: {
    padding: 4,
  },
  thumbnailContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  selectedContainer: {
    opacity: 0.8,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
