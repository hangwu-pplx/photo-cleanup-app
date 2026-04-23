import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { PhotoAssetService } from './types';
import { PhotoAsset, PhotoAnalysisInput } from '../../types';

function mapAsset(asset: MediaLibrary.Asset): PhotoAsset {
  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    width: asset.width,
    height: asset.height,
    creationTime: asset.creationTime * 1000, // convert to ms
    modificationTime: asset.modificationTime * 1000,
    mediaType: asset.mediaType === 'photo' ? 'photo' : 'photo',
    duration: asset.duration,
  };
}

export class ExpoPhotoAssetService implements PhotoAssetService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  async getPhotoAssets(options: { first: number; after?: string }): Promise<{
    assets: PhotoAsset[];
    hasNextPage: boolean;
    endCursor?: string;
  }> {
    const result = await MediaLibrary.getAssetsAsync({
      first: options.first,
      after: options.after,
      mediaType: 'photo',
      sortBy: MediaLibrary.SortBy.creationTime,
    });

    return {
      assets: result.assets.map(mapAsset),
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor,
    };
  }

  async getPhotoAnalysisInput(asset: PhotoAsset): Promise<PhotoAnalysisInput> {
    let fileSize: number | undefined;
    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (info.exists && 'size' in info) {
        fileSize = info.size;
      }
    } catch {
      // ignore
    }

    return {
      asset,
      fileSize,
    };
  }

  async deleteAssets(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      try {
        await MediaLibrary.deleteAssetsAsync([id]);
        success.push(id);
      } catch {
        failed.push(id);
      }
    }

    return { success, failed };
  }
}
