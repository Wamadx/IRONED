import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoChip, GifPanel } from '@/components/move-row';
import { Btn, Dim } from '@/components/ui';
import { EXERCISES, getMistakes } from '@/lib/exercises';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { MuscleGroup } from '@/lib/types';

const FILTERS: (MuscleGroup | 'all' | 'home')[] = [
  'all',
  'home',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'cardio',
];

export default function ExercisePicker() {
  const { target, planId } = useLocalSearchParams<{ target: string; planId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addExercisesToPlan = useApp((s) => s.addExercisesToPlan);
  const addExercisesToActive = useApp((s) => s.addExercisesToActive);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filtersAtEnd, setFiltersAtEnd] = useState(false);
  const [filtersAtStart, setFiltersAtStart] = useState(true);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (filter === 'home' && !e.home) return false;
      if (filter !== 'all' && filter !== 'home' && !e.muscles.includes(filter)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, filter]);

  const confirm = () => {
    if (selected.length) {
      if (target === 'workout') addExercisesToActive(selected);
      else if (planId) addExercisesToPlan(planId, selected);
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 16, paddingBottom: 16 + insets.bottom }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search exercises…"
        placeholderTextColor={C.textFaint}
        style={{
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 10,
          color: C.text,
          padding: 12,
          marginBottom: 10,
        }}
      />

      <View style={{ marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            setFiltersAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 24);
            setFiltersAtStart(contentOffset.x <= 8);
          }}
          scrollEventThrottle={64}
          contentContainerStyle={{ paddingRight: 28 }}
          data={FILTERS}
          keyExtractor={(f) => f}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => setFilter(f)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                marginRight: 8,
                backgroundColor: filter === f ? C.red : C.cardAlt,
                borderWidth: 1,
                borderColor: filter === f ? C.red : C.border,
              }}>
              <Text style={{ color: filter === f ? '#fff' : C.textDim, fontSize: F.small }}>
                {f === 'home' ? 'home-friendly' : f}
              </Text>
            </Pressable>
          )}
        />
        {/* scroll affordances — chevrons show which direction has more filters */}
        {!filtersAtEnd && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 26,
              backgroundColor: C.bg + 'E6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-forward" size={16} color={C.ember} />
          </View>
        )}
        {!filtersAtStart && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 26,
              backgroundColor: C.bg + 'E6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-back" size={16} color={C.ember} />
          </View>
        )}
      </View>

      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: e }) => {
          const sel = selected.includes(e.id);
          const previewing = previewId === e.id;
          return (
            <View
              style={{
                borderRadius: 10,
                marginBottom: 6,
                backgroundColor: sel ? C.cardAlt : C.card,
                borderWidth: 1,
                borderColor: sel ? C.red : C.border,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 }}>
                <Pressable
                  style={{ flex: 1, paddingRight: 8 }}
                  onPress={() =>
                    setSelected((cur) => (sel ? cur.filter((x) => x !== e.id) : [...cur, e.id]))
                  }>
                  <Text style={{ color: C.text, fontSize: F.body, fontWeight: '600' }}>{e.name}</Text>
                  <Dim small>
                    {e.muscles.join(', ')} · {e.equipment}
                    {e.home ? ' · home-friendly' : ''}
                  </Dim>
                </Pressable>
                <DemoChip
                  open={previewing}
                  onPress={() => setPreviewId((cur) => (cur === e.id ? null : e.id))}
                />
                <Text
                  style={{
                    color: sel ? C.red : 'transparent',
                    fontWeight: '800',
                    fontSize: F.h2,
                    marginLeft: 8,
                  }}>
                  ✓
                </Text>
              </View>
              {previewing && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                  <GifPanel name={e.name} mistakes={getMistakes(e.id)} />
                </View>
              )}
            </View>
          );
        }}
      />

      <Btn
        label={selected.length ? `Add ${selected.length} exercise${selected.length > 1 ? 's' : ''}` : 'Cancel'}
        onPress={confirm}
        kind={selected.length ? 'primary' : 'ghost'}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}
