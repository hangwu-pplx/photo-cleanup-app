import * as FileSystem from 'expo-file-system';

const CACHE_DIR = FileSystem.cacheDirectory + 'photo-cleanup/';

export async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function writeCacheFile(filename: string, data: string): Promise<string> {
  await ensureCacheDir();
  const path = CACHE_DIR + filename;
  await FileSystem.writeAsStringAsync(path, data);
  return path;
}

export async function readCacheFile(filename: string): Promise<string | null> {
  const path = CACHE_DIR + filename;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(path);
}

export async function deleteCacheFile(filename: string): Promise<void> {
  const path = CACHE_DIR + filename;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
}

export async function clearCache(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (dirInfo.exists) {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  }
}
