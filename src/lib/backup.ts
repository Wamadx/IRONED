import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { uid } from './physique';
import { useApp } from './store';
import type { Meal, ProgressPhoto } from './types';
import { encrypt, decrypt } from './crypto';

async function fileToB64(uri: string): Promise<string | undefined> {
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  } catch {
    return undefined;
  }
}

async function b64ToFile(b64: string, dir: string): Promise<string | undefined> {
  try {
    const folder = `${FileSystem.documentDirectory}${dir}/`;
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});
    const path = `${folder}${uid()}.jpg`;
    await FileSystem.writeAsStringAsync(path, b64, { encoding: 'base64' });
    return path;
  } catch {
    return undefined;
  }
}

async function payload(): Promise<string> {
  const s = useApp.getState();
  // embed photos as base64 so backups survive reinstalls
  const meals = await Promise.all(
    s.meals.map(async (m) => ({
      ...m,
      photoUri: undefined,
      photoB64: m.photoUri ? await fileToB64(m.photoUri) : undefined,
    }))
  );
  const progressPhotos = await Promise.all(
    s.progressPhotos.map(async (p) => ({
      ...p,
      uri: undefined,
      photoB64: await fileToB64(p.uri),
    }))
  );
  return JSON.stringify({
    app: 'mort_HEVYclone',
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: s.profile,
    plans: s.plans,
    workouts: s.workouts,
    meals,
    macroGoals: s.macroGoals,
    waterLog: s.waterLog,
    waterGoal: s.waterGoal,
    measurements: s.measurements,
    progressPhotos,
    unit: s.unit,
    barWeight: s.barWeight,
    schedule: s.schedule,
    apiKeysEncrypted: encrypt(s.apiKeys),
  });
}

/**
 * Save all app data (photos included, base64-embedded) as a JSON file into a
 * folder the user picks (e.g. Downloads). Falls back to the share sheet.
 */
export async function exportBackup(): Promise<'saved' | 'shared' | 'unavailable' | 'failed'> {
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `hevyclone-backup-${stamp}`;
  try {
    const json = await payload();
    if (Platform.OS === 'android') {
      const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perm.granted) {
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          name,
          'application/json'
        );
        await FileSystem.writeAsStringAsync(uri, json);
        return 'saved';
      }
    }
    const path = `${FileSystem.documentDirectory}${name}.json`;
    await FileSystem.writeAsStringAsync(path, json);
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save backup' });
    return 'shared';
  } catch {
    return 'failed';
  }
}

/** Read the picked file, trying several strategies (plain read → fetch → SAF). */
async function readText(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri);
  } catch {
    try {
      const r = await fetch(uri);
      return await r.text();
    } catch {
      return await FileSystem.StorageAccessFramework.readAsStringAsync(uri);
    }
  }
}

export interface ImportResult {
  status: 'imported' | 'cancelled' | 'unreadable' | 'not-json' | 'not-backup';
  detail?: string;
}

/** Pick a backup JSON and replace all app data with it. */
export async function importBackup(): Promise<ImportResult> {
  let res: DocumentPicker.DocumentPickerResult;
  try {
    res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  } catch (e) {
    return { status: 'unreadable', detail: String((e as Error)?.message ?? e).slice(0, 140) };
  }
  const asset = res.assets?.[0];
  if (res.canceled || !asset) return { status: 'cancelled' };

  let text: string;
  try {
    text = await readText(asset.uri);
  } catch (e) {
    return { status: 'unreadable', detail: String((e as Error)?.message ?? e).slice(0, 140) };
  }

  let data: any;
  try {
    data = JSON.parse(text.replace(/^﻿/, '').trim());
  } catch {
    return { status: 'not-json' };
  }

  const looksRight =
    data?.app === 'mort_HEVYclone' || (Array.isArray(data?.workouts) && Array.isArray(data?.plans));
  if (!looksRight) return { status: 'not-backup' };

  // restore embedded photos to local files
  if (Array.isArray(data.meals)) {
    data.meals = await Promise.all(
      data.meals.map(async (m: Meal & { photoB64?: string }) => ({
        ...m,
        photoB64: undefined,
        photoUri: m.photoB64 ? await b64ToFile(m.photoB64, 'meal-photos') : undefined,
      }))
    );
  }
  let photos: ProgressPhoto[] | undefined;
  if (Array.isArray(data.progressPhotos)) {
    photos = (
      await Promise.all(
        data.progressPhotos.map(async (p: ProgressPhoto & { photoB64?: string }) => {
          const uri = p.photoB64 ? await b64ToFile(p.photoB64, 'body-photos') : undefined;
          return uri ? { id: p.id, time: p.time, uri } : null;
        })
      )
    ).filter(Boolean) as ProgressPhoto[];
  }

  // Restore embedded photos first
  useApp.getState().importAll({ ...data, progressPhotos: photos });

  // Decrypt API keys if present (after importAll, so they aren't overwritten)
  if (data.apiKeysEncrypted) {
    const decrypted = decrypt(data.apiKeysEncrypted) as { exercisedb?: string; gemini?: string };
    const current = useApp.getState().apiKeys;
    const merged = {
      exercisedb: decrypted.exercisedb ?? current.exercisedb,
      gemini: decrypted.gemini ?? current.gemini,
    };
    useApp.getState().setApiKey('exercisedb', merged.exercisedb);
    useApp.getState().setApiKey('gemini', merged.gemini);
  } else {
    // No encrypted API keys – nothing to do
  }
  return { status: 'imported' };}