import { create } from 'zustand';
import { PhotoAsset } from '../types';

interface SelectionState {
  selectedIds: Set<string>;
  photos: PhotoAsset[];
  toggleSelection: (id: string) => void;
  setPhotos: (photos: PhotoAsset[]) => void;
  selectRange: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  photos: [],

  toggleSelection: (id: string) =>
    set(state => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  setPhotos: (photos: PhotoAsset[]) => set({ photos }),

  selectRange: (ids: string[]) =>
    set(state => {
      const next = new Set(state.selectedIds);
      for (const id of ids) next.add(id);
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  isSelected: (id: string) => get().selectedIds.has(id),
}));
