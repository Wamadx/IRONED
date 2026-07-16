import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { getGifSource, type GifSource } from './gifs';

/**
 * Download-once demo cache. Each demo costs at most ONE remote request per file,
 * per install — after that it's served from a local file, even offline.
 * On web (dev preview in Chrome) files aren't available; falls back to the
 * direct URLs there, so validate quota behaviour on the phone.
 */
const DIR = `${FileSystem.documentDirectory}gif-cache/`;

async function download(url: string, path: string, headers?: Record<string, string>): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists && (info.size ?? 0) > 0) return path;
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const dl = await FileSystem.downloadAsync(url, path, { headers });
    if (dl.status === 200) return path;
    await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

const inflight = new Map<string, Promise<GifSource | null>>();

async function resolve(name: string): Promise<GifSource | null> {
  const src = getGifSource(name);
  if (!src) return null;
  if (Platform.OS === 'web') return src;

  if (src.kind === 'frames') {
    const local = await Promise.all(
      src.frames.map((url, i) => {
        // extract folder name from url to make filename content-specific
        const parts = url.split('/');
        const folder = parts[parts.length - 2] || 'unknown';
        return download(url, `${DIR}${folder}-f${i}.jpg`);
      })
    );
    // fall back to remote URLs for any frame that failed
    return { kind: 'frames', frames: local.map((p, i) => p ?? src.frames[i]) };
  }
  
  const match = src.uri.match(/[?&]exerciseId=([^&]+)/);
  const id = match ? match[1] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = await download(src.uri, `${DIR}db-${id}.gif`, src.headers);
  return path ? { kind: 'gif', uri: path } : src;
}

export function getCachedGif(name: string): Promise<GifSource | null> {
  const key = name.toLowerCase();
  let p = inflight.get(key);
  if (!p) {
    p = resolve(name).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}
