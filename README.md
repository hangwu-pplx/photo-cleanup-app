# Photo Cleanup

An offline-first, privacy-focused mobile app for finding duplicate and burst-like photos, reviewing recommendations, and safely deleting unwanted shots.

## Philosophy

- **100% offline**: No backend, no accounts, no cloud sync, no ads, no subscriptions
- **Privacy first**: Your photos never leave your device
- **Trust through transparency**: Every recommendation shows its reasoning. Nothing is auto-deleted
- **Conservative**: Precision over recall. We would rather miss a duplicate than group unrelated photos

## Current MVP

This is a functional MVP using deterministic heuristics. It groups photos by time proximity, filename patterns, and metadata similarity, then recommends which photo to keep based on interpretable quality signals.

### What works now

- Select 20-50 photos from your library
- Group likely duplicates and burst sequences
- Review recommendations with confidence scores and reasons
- Manually override which photo to keep in any group
- Explicit confirmation before any deletion
- Settings for confirmation toggle and display preferences

### What is mocked vs real

| Component | Status | Notes |
|-----------|--------|-------|
| Photo access | Real | Uses `expo-media-library` |
| Similarity detection | Heuristic | Time window + filename + aspect ratio + file size |
| Clustering | Real | Union-find on similarity pairs |
| Quality scoring | Heuristic | Resolution, file size proxy, filename hints |
| Face detection | Mocked | Uses filename hints only; real face detection planned |
| Sharpness/blur detection | Mocked | Uses bytes-per-pixel as proxy |
| ML embedding comparison | Mocked | Planned for native on-device ML (TensorFlow Lite or Core ML) |
| Deletion | Real | Uses `expo-media-library` delete API |

### Architecture

```
app/                  Expo Router screens
  _layout.tsx         Root navigator
  index.tsx           Home / onboarding
  picker.tsx          Photo selection grid
  processing.tsx      Analysis pipeline UI
  review.tsx          Group review & override
  settings.tsx        App settings

components/
  picker/             Photo picker sub-components
  processing/         Progress indicators
  review/             Cluster cards, photo options
  shared/             Reusable UI primitives

domain/               Pure business logic (testable, no React)
  photo/
    types.ts          PhotoAssetService interface
    expo-asset-service.ts  Expo MediaLibrary adapter
  similarity/
    types.ts          SimilarityEngine interface
    heuristic-similarity-engine.ts  Time + metadata heuristics
    clustering-engine.ts  Union-find clustering
  quality/
    types.ts          QualityEngine interface
    heuristic-quality-engine.ts  Resolution + size heuristics
  recommendation/
    types.ts          RecommendationService interface
    conservative-recommendation-service.ts  Margin-based recommendations
    explanation-service.ts  Human-readable explanations
  cleanup/
    types.ts          DeletionPlanner + DeleteService interfaces
    deletion-planner.ts  Safe plan builder
    expo-delete-service.ts  Expo delete adapter
    pipeline.ts       Orchestrates the full flow

store/                Zustand state management
  selectionStore.ts   Selected photo IDs
  processingStore.ts  Pipeline progress & results
  reviewStore.ts    User overrides & effective recommendations
  settingsStore.ts  User preferences (persisted)

lib/
  utils/              Pure helper functions
  cache/              File-system cache helpers

types/                Shared TypeScript types
constants/            App constants & thresholds

__tests__/            Unit tests for pure logic
```

### Pipeline stages

1. **Normalize/filter assets** — Load selected photos, build analysis inputs
2. **Build analysis inputs** — Extract metadata, file size, thumbnail references
3. **Generate candidate pairs** — Time-aware windowing + metadata heuristics
4. **Cluster accepted pairs** — Union-find into duplicate/burst/similar groups
5. **Rank photos within groups** — Interpretable quality signals
6. **Build reasons and confidence** — Conservative thresholds for auto-recommendation
7. **Build deletion plan for review** — Plan only; no direct deletion without confirmation

### Key design decisions

- **Deterministic MVP**: We use heuristics instead of ML embeddings for the first pass so the app works immediately on all devices without heavy native dependencies
- **Replaceable interfaces**: Every domain service is an interface. Swapping in a TensorFlow Lite similarity engine or Core ML quality engine requires only implementing the interface and changing one line in the pipeline config
- **Conservative thresholds**: `MIN_RECOMMENDATION_CONFIDENCE = 0.75` and `MIN_RECOMMENDATION_MARGIN = 0.15`. If confidence or margin is too low, the group goes to manual review
- **No auto-delete**: The deletion planner builds a plan. The UI requires explicit user confirmation. Platform deletion behavior (Recently Deleted on iOS, manufacturer-specific on Android) is clearly explained
- **Precision over recall**: Photos that do not clearly belong to a group are left ungrouped

## Running the app

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator, or a physical device with Expo Go

### Setup

```bash
npm install
npx expo prebuild
```

### Run

```bash
npx expo start
# Press 'i' for iOS simulator, 'a' for Android emulator
```

For development builds (required for `expo-media-library` on iOS):

```bash
npx expo run:ios
npx expo run:android
```

### Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run lint          # TypeScript type check
```

## Next steps for native ML

1. **On-device embedding model**: Integrate TensorFlow Lite or Core ML for photo embeddings. The `SimilarityEngine` interface accepts this with no other code changes
2. **Face detection**: Replace filename-based face proxy with `expo-face-detector` or native Vision APIs. The `QualityEngine` interface accepts this
3. **Sharpness/blur detection**: Add a native module for Laplacian variance or ML-based blur detection
4. **Scene classification**: Use on-device classification to avoid grouping photos of different scenes
5. **Thumbnail analysis**: Build small analysis thumbnails for faster processing of large batches

## License

MIT
