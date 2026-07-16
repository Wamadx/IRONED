import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, NumInput, TrashConfirm } from '@/components/ui';
import { uid } from '@/lib/physique';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { MetricId } from '@/lib/types';

const METRICS: { id: MetricId; label: string; unit: string }[] = [
  { id: 'weight', label: 'Body weight', unit: 'kg' },
  { id: 'waist', label: 'Waist', unit: 'cm' },
  { id: 'chest', label: 'Chest', unit: 'cm' },
  { id: 'arm', label: 'Arm (flexed)', unit: 'cm' },
  { id: 'thigh', label: 'Thigh', unit: 'cm' },
  { id: 'hips', label: 'Hips', unit: 'cm' },
];

async function persistPhoto(uri: string): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  try {
    const dir = `${FileSystem.documentDirectory}body-photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${uid()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return undefined;
  }
}

export default function Measurements() {
  const insets = useSafeAreaInsets();
  const measurements = useApp((s) => s.measurements);
  const addMeasurement = useApp((s) => s.addMeasurement);
  const photos = useApp((s) => s.progressPhotos);
  const addProgressPhoto = useApp((s) => s.addProgressPhoto);
  const deleteProgressPhoto = useApp((s) => s.deleteProgressPhoto);

  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const historyOf = (metric: MetricId) =>
    measurements.filter((m) => m.metric === metric).sort((a, b) => b.time - a.time);

  const addPhoto = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      quality: 0.6,
      allowsEditing: true,
      aspect: [3, 4],
    };
    let result: ImagePicker.ImagePickerResult;
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    const asset = result.assets?.[0];
    if (!asset) return;
    const saved = await persistPhoto(asset.uri);
    if (saved) addProgressPhoto(saved);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled">
      <Dim>
        The scale can’t tell muscle from fat — the tape can. Log these every week or two and watch
        the trend, not the daily noise.
      </Dim>

      {METRICS.map((metric) => {
        const hist = historyOf(metric.id);
        const latest = hist[0];
        const prev = hist[1];
        const delta = latest && prev ? latest.value - prev.value : null;
        return (
          <Card key={metric.id} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <H2>{metric.label}</H2>
                <Dim small>
                  {latest
                    ? `${latest.value} ${metric.unit} · ${new Date(latest.time).toLocaleDateString()}` +
                      (delta !== null
                        ? ` · ${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} since last`
                        : '')
                    : 'Not logged yet'}
                </Dim>
              </View>
              <NumInput
                value={drafts[metric.id] ?? 0}
                onChange={(n) => setDrafts((d) => ({ ...d, [metric.id]: n }))}
              />
              <View style={{ marginLeft: 8 }}>
                <Btn
                  label="Log"
                  kind="ghost"
                  onPress={() => {
                    const v = drafts[metric.id];
                    if (v && v > 0) addMeasurement(metric.id, Math.round(v * 10) / 10);
                  }}
                />
              </View>
            </View>
          </Card>
        );
      })}

      <Card style={{ marginTop: 16 }}>
        <H2>Progress photos</H2>
        <Dim small>
          Stored privately inside the app — never added to your gallery, and kept even if gallery
          copies are deleted. Same pose, same lighting, every few weeks.
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Btn label="Camera" icon="camera" kind="ghost" style={{ flex: 1 }} onPress={() => addPhoto(true)} />
          <Btn label="Gallery" icon="images-outline" kind="ghost" style={{ flex: 1 }} onPress={() => addPhoto(false)} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {photos.map((p) => (
            <View key={p.id} style={{ width: '31%' }}>
              <Image
                source={{ uri: p.uri }}
                style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: C.cardAlt }}
                contentFit="cover"
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 2,
                }}>
                <Text style={{ color: C.textFaint, fontSize: F.small }}>
                  {new Date(p.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <TrashConfirm size={14} onDelete={() => deleteProgressPhoto(p.id)} />
              </View>
            </View>
          ))}
        </View>
        {photos.length === 0 && <Dim small>{'\n'}No photos yet.</Dim>}
      </Card>
    </ScrollView>
  );
}
