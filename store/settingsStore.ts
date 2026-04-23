import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  minClusterSize: number;
  maxPhotosPerBatch: number;
  requireConfirmation: boolean;
  showFileNames: boolean;
  setMinClusterSize: (size: number) => void;
  setMaxPhotosPerBatch: (size: number) => void;
  setRequireConfirmation: (val: boolean) => void;
  setShowFileNames: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      minClusterSize: 2,
      maxPhotosPerBatch: 50,
      requireConfirmation: true,
      showFileNames: false,
      setMinClusterSize: (size: number) => set({ minClusterSize: size }),
      setMaxPhotosPerBatch: (size: number) => set({ maxPhotosPerBatch: size }),
      setRequireConfirmation: (val: boolean) => set({ requireConfirmation: val }),
      setShowFileNames: (val: boolean) => set({ showFileNames: val }),
    }),
    {
      name: 'photo-cleanup-settings',
    }
  )
);
