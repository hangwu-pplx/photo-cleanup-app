import { create } from 'zustand';
import { ProcessingState, PipelineResult } from '../types';

interface ProcessingStoreState {
  state: ProcessingState;
  result: PipelineResult | null;
  setState: (state: ProcessingState) => void;
  setResult: (result: PipelineResult) => void;
  reset: () => void;
}

const initialState: ProcessingState = {
  stage: 'idle',
  progress: 0,
  totalPhotos: 0,
  processedPhotos: 0,
  message: '',
};

export const useProcessingStore = create<ProcessingStoreState>(set => ({
  state: initialState,
  result: null,
  setState: (state: ProcessingState) => set({ state }),
  setResult: (result: PipelineResult) => set({ result }),
  reset: () => set({ state: initialState, result: null }),
}));
