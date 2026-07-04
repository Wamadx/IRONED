import { EXERCISEDB_API_KEY } from './config';
import { GIF_MAP } from './gif-map';
import { useApp } from './store';

const HOST = 'exercisedb.p.rapidapi.com';
const FREE_DB = 'https://yuhonas.github.io/free-exercise-db/exercises';

/** user-provided key from settings wins over the baked-in dev key */
const dbKey = () => useApp.getState().apiKeys.exercisedb || EXERCISEDB_API_KEY;

/** true when this move HAS a demo but it can't load because no ExerciseDB key is set */
export function demoNeedsKey(name: string): boolean {
  const entry = GIF_MAP[name.toLowerCase()];
  return !!entry && 'db' in entry && !dbKey();
}

export type GifSource =
  | { kind: 'gif'; uri: string; headers?: Record<string, string> }
  /** two demo frames cycled in-app so the demo is always animated */
  | { kind: 'frames'; frames: string[] };

/**
 * Resolve demo media for an exercise/move name. Pure lookup — no search API calls.
 * Media bytes are downloaded once and cached locally (see gif-cache.ts).
 */
export function getGifSource(name: string): GifSource | null {
  const entry = GIF_MAP[name.toLowerCase()];
  if (!entry) return null;
  if ('img' in entry) {
    return {
      kind: 'frames',
      frames: [`${FREE_DB}/${entry.img}/0.jpg`, `${FREE_DB}/${entry.img}/1.jpg`],
    };
  }
  const key = dbKey();
  if (!key) return null;
  return {
    kind: 'gif',
    uri: `https://${HOST}/image?exerciseId=${entry.db}&resolution=360`,
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': HOST,
    },
  };
}
