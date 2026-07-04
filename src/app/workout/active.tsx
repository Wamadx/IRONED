import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LevelUpOverlay } from '@/components/level-up';
import { ActionChip, DemoChip, GifPanel, MoveRow } from '@/components/move-row';
import { Btn, Card, ConfirmBtn, Dim, H2, NumInput } from '@/components/ui';
import { cooldownFor, getExercise, getMistakes, MACHINE_SWAP, warmupFor } from '@/lib/exercises';
import { lastPerformance, useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { MuscleGroup } from '@/lib/types';
import { levelInfo, totalXp } from '@/lib/xp';

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

const PLATE_SIZES = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

function platesFor(total: number, bar: number, unit: 'kg' | 'lb'): string {
  if (total <= bar) return 'empty bar or lighter';
  let perSide = (total - bar) / 2;
  const out: number[] = [];
  for (const p of PLATE_SIZES[unit]) {
    while (perSide >= p - 1e-9) {
      out.push(p);
      perSide -= p;
    }
  }
  const rest = perSide > 0.01 ? ` (+${perSide.toFixed(1)} short)` : '';
  return `${out.join(' + ')}${rest}`;
}

export default function ActiveWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = useApp((s) => s.active);
  const workouts = useApp((s) => s.workouts);
  const updateActiveSet = useApp((s) => s.updateActiveSet);
  const addActiveSet = useApp((s) => s.addActiveSet);
  const removeActiveSet = useApp((s) => s.removeActiveSet);
  const removeActiveExercise = useApp((s) => s.removeActiveExercise);
  const toggleMachineVariant = useApp((s) => s.toggleMachineVariant);
  const cycleVariant = useApp((s) => s.cycleVariant);
  const pauseWorkout = useApp((s) => s.pauseWorkout);
  const resumeWorkout = useApp((s) => s.resumeWorkout);
  const finishWorkout = useApp((s) => s.finishWorkout);
  const cancelWorkout = useApp((s) => s.cancelWorkout);
  const unit = useApp((s) => s.unit);
  const barWeight = useApp((s) => s.barWeight);

  const [now, setNow] = useState(Date.now());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [showWarmup, setShowWarmup] = useState(false);
  const [openDemos, setOpenDemos] = useState<Record<number, boolean>>({});
  const [openPlates, setOpenPlates] = useState<Record<number, boolean>>({});
  const [collapsedEx, setCollapsedEx] = useState<Record<number, boolean>>({});
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const vibrated = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (restEndsAt !== null && now >= restEndsAt && !vibrated.current) {
      vibrated.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      setTimeout(() => setRestEndsAt(null), 1500);
    }
  }, [now, restEndsAt]);

  if (!active) {
    // finishing clears `active` — if a level-up is pending, celebrate instead of the fallback
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        {levelUp !== null ? (
          <LevelUpOverlay
            level={levelUp}
            onDone={() => {
              setLevelUp(null);
              router.replace('/');
            }}
          />
        ) : (
          <>
            <Dim>No active workout.</Dim>
            <Btn label="Go home" style={{ marginTop: 12 }} onPress={() => router.replace('/')} />
          </>
        )}
      </View>
    );
  }

  const paused = active.lastResumedAt === null;
  // training time excluding pauses (old sessions without the fields fall back to wall time)
  const elapsed =
    active.activeMs !== undefined || active.lastResumedAt !== undefined
      ? (active.activeMs ?? 0) + (active.lastResumedAt != null ? now - active.lastResumedAt : 0)
      : now - active.startedAt;

  const muscles = [...new Set(active.exercises.flatMap((e) => getExercise(e.exerciseId).muscles))] as MuscleGroup[];
  const warmup = warmupFor(muscles);
  const cooldown = cooldownFor(muscles);

  const startRest = (seconds: number) => {
    if (seconds > 0 && !paused) {
      vibrated.current = false;
      setRestEndsAt(Date.now() + seconds * 1000);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${active.name} · ${fmtClock(elapsed)}${paused ? ' ⏸' : ''}`,
        }}
      />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
          keyboardShouldPersistTaps="handled">
          <Btn
            label={paused ? 'Resume Workout — timer paused' : 'Pause Workout'}
            icon={paused ? 'play' : 'pause'}
            kind={paused ? 'primary' : 'ghost'}
            onPress={() => {
              if (paused) {
                resumeWorkout();
              } else {
                pauseWorkout();
                setRestEndsAt(null);
              }
            }}
            style={{ marginBottom: 12 }}
          />

          {warmup.length > 0 && (
            <Card style={{ borderColor: C.ember }}>
              {/* only the header toggles — taps inside the open card can't close it */}
              <Pressable
                onPress={() => setShowWarmup((v) => !v)}
                hitSlop={8}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flame" size={18} color={C.ember} />
                  <H2>Suggested warmup</H2>
                </View>
                <Ionicons name={showWarmup ? 'chevron-up' : 'chevron-down'} size={18} color={C.ember} />
              </Pressable>
              {showWarmup && warmup.map((w) => <MoveRow key={w.name} move={w} />)}
            </Card>
          )}

          {active.exercises.map((we, i) => {
            const ex = getExercise(we.exerciseId);
            const prev = lastPerformance(workouts, we.exerciseId);
            const demoOpen = !!openDemos[i];
            const isCollapsed = !!collapsedEx[i];
            const doneCount = we.sets.filter((s) => s.done).length;
            const complete = doneCount === we.sets.length && we.sets.length > 0;
            return (
              <Card key={`${we.exerciseId}-${i}`} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* tap the title to collapse/expand this exercise */}
                  <Pressable
                    style={{ flex: 1, paddingRight: 8 }}
                    onPress={() => setCollapsedEx((cur) => ({ ...cur, [i]: !cur[i] }))}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <H2>{ex.name}</H2>
                      <Ionicons
                        name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                        size={14}
                        color={C.textFaint}
                      />
                    </View>
                    <Dim small>
                      {ex.muscles.join(' · ')}
                      {we.supersetWithNext ? '  ·  superset ↓ no rest between' : ''}
                      {i > 0 && active.exercises[i - 1].supersetWithNext ? '  ·  superset ↑' : ''}
                    </Dim>
                    {isCollapsed ? (
                      <View style={{ marginTop: 4 }}>
                        <Text
                          style={{
                            color: complete ? C.good : C.textDim,
                            fontSize: F.small,
                            fontWeight: '700',
                          }}>
                          {doneCount}/{we.sets.length} sets done
                        </Text>
                        <View
                          style={{
                            height: 5,
                            backgroundColor: C.cardAlt,
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginTop: 3,
                          }}>
                          <View
                            style={{
                              width: `${we.sets.length ? (doneCount / we.sets.length) * 100 : 0}%`,
                              height: '100%',
                              backgroundColor: complete ? C.good : C.red,
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      <Dim small>
                        {prev
                          ? 'Last time: ' +
                            prev
                              .map((s) =>
                                ex.cardio ? `${s.weight}km/${s.reps}min` : `${s.weight}${unit}×${s.reps}`
                              )
                              .join(', ')
                          : 'First time — set your baseline'}
                      </Dim>
                    )}
                  </Pressable>
                  <DemoChip
                    open={demoOpen}
                    onPress={() => setOpenDemos((cur) => ({ ...cur, [i]: !cur[i] }))}
                  />
                  <Pressable
                    onPress={() => removeActiveExercise(i)}
                    hitSlop={10}
                    style={{ marginLeft: 10, padding: 4 }}>
                    <Ionicons name="close" size={20} color={C.textFaint} />
                  </Pressable>
                </View>

                {!isCollapsed && (
                  <>
                {demoOpen && (
                  <GifPanel
                    name={ex.name}
                    mistakes={getMistakes(ex.id)}
                    action={
                      <ActionChip
                        icon="shuffle"
                        label={ex.cardio ? 'Try another cardio' : `Next ${ex.muscles[0]} variation`}
                        onPress={() => cycleVariant(i)}
                      />
                    }
                  />
                )}

                {ex.equipment === 'barbell' && (
                  <View style={{ marginTop: 8 }}>
                    <Pressable
                      onPress={() => setOpenPlates((cur) => ({ ...cur, [i]: !cur[i] }))}
                      hitSlop={6}
                      style={({ pressed }) => ({
                        alignSelf: 'flex-start',
                        backgroundColor: C.cardAlt,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 8,
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="calculator-outline" size={14} color={C.textDim} />
                        <Text style={{ color: C.textDim, fontSize: F.small, fontWeight: '600' }}>
                          Plates
                        </Text>
                        <Ionicons
                          name={openPlates[i] ? 'chevron-down' : 'chevron-forward'}
                          size={12}
                          color={C.textDim}
                        />
                      </View>
                    </Pressable>
                    {openPlates[i] &&
                      [...new Set(we.sets.map((s) => s.weight).filter((w) => w > 0))].map((w) => (
                        <Dim key={w} small>
                          {w} {unit} → per side: {platesFor(w, barWeight, unit)}
                        </Dim>
                      ))}
                    {openPlates[i] && (
                      <Dim small>
                        {barWeight} {unit} bar · plates {PLATE_SIZES[unit].join('/')} (change in
                        Settings)
                      </Dim>
                    )}
                  </View>
                )}

                {active.location !== 'home' && (we.swappedFrom || MACHINE_SWAP[we.exerciseId]) && (
                  <Pressable
                    onPress={() => toggleMachineVariant(i)}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: we.swappedFrom ? C.redDark : C.cardAlt,
                      borderWidth: 1,
                      borderColor: we.swappedFrom ? C.red : C.border,
                      borderRadius: 8,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons
                        name="swap-horizontal"
                        size={14}
                        color={we.swappedFrom ? '#fff' : C.textDim}
                      />
                      <Text
                        style={{
                          color: we.swappedFrom ? '#fff' : C.textDim,
                          fontSize: F.small,
                          fontWeight: '600',
                        }}>
                        {we.swappedFrom
                          ? `On machine — switch back to ${getExercise(we.swappedFrom).name}`
                          : `Machine option: ${getExercise(MACHINE_SWAP[we.exerciseId]).name}`}
                      </Text>
                    </View>
                  </Pressable>
                )}

                <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 4, alignItems: 'center' }}>
                  <Text style={{ color: C.textFaint, fontSize: F.small, width: 30 }}>SET</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: C.textFaint, fontSize: F.small, width: 64, textAlign: 'center' }}>
                    {ex.cardio ? 'KM' : unit.toUpperCase()}
                  </Text>
                  <Text style={{ color: C.textFaint, fontSize: F.small, width: 64, textAlign: 'center', marginLeft: 8 }}>
                    {ex.cardio ? 'MIN' : 'REPS'}
                  </Text>
                  <Text style={{ color: C.textFaint, fontSize: F.small, width: 44, textAlign: 'center', marginLeft: 8 }}>
                    ✓
                  </Text>
                </View>

                {we.sets.map((st, si) => (
                  <View key={si} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ color: C.textDim, width: 30 }}>{si + 1}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={{ width: 64 }}>
                      <NumInput value={st.weight} onChange={(n) => updateActiveSet(i, si, { weight: n })} />
                    </View>
                    <View style={{ width: 64, marginLeft: 8 }}>
                      <NumInput value={st.reps} onChange={(n) => updateActiveSet(i, si, { reps: n })} />
                    </View>
                    <Pressable
                      onPress={() => {
                        const nowDone = !st.done;
                        updateActiveSet(i, si, { done: nowDone });
                        // superset: no rest yet — move straight to the linked exercise
                        if (nowDone && !ex.cardio && !we.supersetWithNext) startRest(we.restSeconds);
                      }}
                      style={{
                        width: 44,
                        height: 34,
                        marginLeft: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: st.done ? C.red : C.cardAlt,
                        borderWidth: 1,
                        borderColor: st.done ? C.red : C.border,
                      }}>
                      <Text style={{ color: st.done ? '#fff' : C.textFaint, fontWeight: '800' }}>✓</Text>
                    </Pressable>
                  </View>
                ))}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Btn label="+ Set" kind="ghost" onPress={() => addActiveSet(i)} style={{ flex: 1 }} />
                  {we.sets.length > 1 && (
                    <Btn label="− Set" kind="ghost" onPress={() => removeActiveSet(i)} style={{ flex: 1 }} />
                  )}
                </View>
                  </>
                )}
              </Card>
            );
          })}

          <Btn
            label="+ Add Exercise"
            kind="ghost"
            style={{ marginTop: 12 }}
            onPress={() => router.push({ pathname: '/exercise-picker', params: { target: 'workout' } })}
          />

          <Card style={{ marginTop: 16, borderColor: C.smoke }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="snow" size={18} color={C.textDim} />
              <H2>Cooldown (after your last set)</H2>
            </View>
            {cooldown.map((cd) => (
              <MoveRow key={cd.name} move={cd} />
            ))}
          </Card>

          <Dim small>
            Finishing early is fine — only the sets you checked off are saved. Unchecked sets are
            simply skipped.
          </Dim>
          <ConfirmBtn
            label="Finish Workout"
            confirmLabel="Tap again to finish & save"
            kind="primary"
            style={{ marginTop: 8 }}
            onConfirm={() => {
              const before = levelInfo(totalXp(workouts)).level;
              finishWorkout();
              const after = levelInfo(totalXp(useApp.getState().workouts)).level;
              if (after > before) {
                setLevelUp(after);
              } else {
                router.replace('/');
              }
            }}
          />
          <ConfirmBtn
            label="Discard Workout"
            confirmLabel="Tap again to discard — nothing saved"
            style={{ marginTop: 10 }}
            onConfirm={() => {
              cancelWorkout();
              router.replace('/');
            }}
          />
        </ScrollView>

        {levelUp !== null && (
          <LevelUpOverlay
            level={levelUp}
            onDone={() => {
              setLevelUp(null);
              router.replace('/');
            }}
          />
        )}

        {restEndsAt !== null && (
          <View
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 12 + insets.bottom,
              backgroundColor: now >= restEndsAt ? C.good : C.redDark,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ color: '#fff', fontSize: F.h1, fontWeight: '800' }}>
              {now >= restEndsAt ? 'GO!' : `REST ${fmtClock(restEndsAt - now)}`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setRestEndsAt((t) => (t ? t - 15000 : t))}
                style={{ padding: 8, backgroundColor: '#00000040', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>-15s</Text>
              </Pressable>
              <Pressable
                onPress={() => setRestEndsAt((t) => (t ? t + 15000 : t))}
                style={{ padding: 8, backgroundColor: '#00000040', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>+15s</Text>
              </Pressable>
              <Pressable
                onPress={() => setRestEndsAt(null)}
                style={{ padding: 8, backgroundColor: '#00000040', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Skip</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
