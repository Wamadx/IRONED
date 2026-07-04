import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Dim, Title, TrashConfirm } from '@/components/ui';
import { doneSets, useApp, workoutVolume } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { Workout } from '@/lib/types';

const DAY = 24 * 3600 * 1000;

/** LOCAL-timezone calendar day key — UTC math here shifts days for anyone east/west of UTC. */
function localDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** the local date N cells before today */
function cellDate(back: number): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate() - back);
}

/** GitHub-style heatmap of the last 12 weeks; tap a day to see its contribution. */
function Heatmap({
  workouts,
  selected,
  onSelect,
}: {
  workouts: Workout[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const setsPerDay = new Map<string, number>();
  for (const w of workouts) {
    const key = localDayKey(w.finishedAt);
    setsPerDay.set(key, (setsPerDay.get(key) ?? 0) + doneSets(w.exercises));
  }
  const weeks = 12;
  const total = weeks * 7;
  const color = (sets: number) =>
    sets === 0 ? C.cardAlt : sets < 5 ? C.redDark : sets < 15 ? C.red : C.ember;
  return (
    <View style={{ flexDirection: 'row', marginTop: 10 }}>
      {Array.from({ length: weeks }, (_, wk) => (
        <View key={wk} style={{ flex: 1 }}>
          {Array.from({ length: 7 }, (_, d) => {
            const back = total - 1 - (wk * 7 + d);
            const key = localDayKey(cellDate(back).getTime());
            const sets = setsPerDay.get(key) ?? 0;
            return (
              <Pressable
                key={d}
                onPress={() => onSelect(key)}
                style={{
                  aspectRatio: 1,
                  margin: 1.5,
                  borderRadius: 3,
                  backgroundColor: color(sets),
                  borderWidth: selected === key ? 1.5 : 0,
                  borderColor: '#fff',
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const workouts = useApp((s) => s.workouts);
  const deleteWorkout = useApp((s) => s.deleteWorkout);
  const unit = useApp((s) => s.unit);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dayWorkouts =
    selectedDay === null ? [] : workouts.filter((w) => localDayKey(w.finishedAt) === selectedDay);
  const selectedLabel = (() => {
    if (selectedDay === null) return '';
    const [y, m, d] = selectedDay.split('-').map(Number);
    return fmtDate(new Date(y, m, d).getTime());
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        paddingBottom: 32 + insets.bottom,
      }}>
      <Title>HISTORY</Title>
      <Dim>
        {workouts.length} workout{workouts.length === 1 ? '' : 's'} logged. Tap the trash twice to
        delete one.
      </Dim>

      <Card style={{ marginTop: 12 }}>
        <Dim small>LAST 12 WEEKS — tap a day to see its contribution</Dim>
        <Heatmap workouts={workouts} selected={selectedDay} onSelect={setSelectedDay} />
        {selectedDay !== null && (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 }}>
            <Dim small>
              {selectedLabel} —{' '}
              {dayWorkouts.length === 0
                ? 'no training logged'
                : `${dayWorkouts.length} workout${dayWorkouts.length === 1 ? '' : 's'}, ${dayWorkouts.reduce((s, w) => s + doneSets(w.exercises), 0)} sets, ${Math.round(dayWorkouts.reduce((s, w) => s + workoutVolume(w.exercises), 0)).toLocaleString()} ${unit}`}
            </Dim>
            {dayWorkouts.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}>
                <Text style={{ color: C.red, fontSize: F.body, fontWeight: '600', marginTop: 4 }}>
                  {fmtTime(w.startedAt)} · {w.name} →
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      {workouts.map((w) => {
        const vol = workoutVolume(w.exercises);
        return (
          <Pressable
            key={w.id}
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}>
            {({ pressed }) => (
              <Card style={{ marginTop: 12, opacity: pressed ? 0.7 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: C.text, fontSize: F.h2, fontWeight: '700', flex: 1 }}>
                    {w.name}
                  </Text>
                  <Dim small>
                    {fmtDate(w.finishedAt)} · {fmtTime(w.startedAt)}
                  </Dim>
                  <View style={{ marginLeft: 10 }}>
                    <TrashConfirm onDelete={() => deleteWorkout(w.id)} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {w.location && (
                    <Ionicons
                      name={w.location === 'home' ? 'home-outline' : 'barbell-outline'}
                      size={12}
                      color={C.textFaint}
                    />
                  )}
                  <Dim small>
                    {fmtDuration(w.durationMs ?? w.finishedAt - w.startedAt)} · {doneSets(w.exercises)}{' '}
                    sets
                    {vol > 0 ? ` · ${Math.round(vol).toLocaleString()} ${unit} volume` : ''}
                  </Dim>
                </View>
              </Card>
            )}
          </Pressable>
        );
      })}

      {workouts.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <Dim>Nothing here yet. Finish your first workout and it will show up.</Dim>
        </Card>
      )}
    </ScrollView>
  );
}
