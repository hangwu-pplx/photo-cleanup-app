import { PhotoAsset, PhotoAnalysisInput } from '../../types';

export interface PhotoAssetService {
  requestPermissions(): Promise<boolean>;
  getPhotoAssets(options: { first: number; after?: string }): Promise<{
    assets: PhotoAsset[];
    hasNextPage: boolean;
    endCursor?: string;
  }>;
  getPhotoAnalysisInput(asset: PhotoAsset): Promise<PhotoAnalysisInput>;
  deleteAssets(ids: string[]): Promise<{ success: string[]; failed: string[] }>;
}
