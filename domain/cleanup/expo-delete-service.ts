import { DeleteService } from './types';
import { DeletionPlan } from '../../types';
import { PhotoAssetService } from '../photo/types';

export class ExpoDeleteService implements DeleteService {
  constructor(private assetService: PhotoAssetService) {}

  async executePlan(plan: DeletionPlan): Promise<{ success: string[]; failed: string[] }> {
    const toDelete = plan.items
      .filter(i => i.action === 'delete')
      .map(i => i.photoId);

    if (toDelete.length === 0) {
      return { success: [], failed: [] };
    }

    return this.assetService.deleteAssets(toDelete);
  }
}
