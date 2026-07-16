import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortables';

import { Btn, Card, ConfirmBtn, Dim, H2, NumInput } from '@/components/ui';
import { getExercise, resolveExerciseId } from '@/lib/exercises';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { PlanExercise } from '@/lib/types';

export default function PlanEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plan = useApp((s) => s.plans.find((p) => p.id === id));
  const location = useApp((s) => s.profile.location);
  const unit = useApp((s) => s.unit);
  const renamePlan = useApp((s) => s.renamePlan);
  const deletePlan = useApp((s) => s.deletePlan);
  const removePlanExercise = useApp((s) => s.removePlanExercise);
  const movePlanExercise = useApp((s) => s.movePlanExercise);
  const setPlanExercises = useApp((s) => s.setPlanExercises);
  const togglePlanSuperset = useApp((s) => s.togglePlanSuperset);
  const setPlanRest = useApp((s) => s.setPlanRest);
  const addPlanSet = useApp((s) => s.addPlanSet);
  const removePlanSet = useApp((s) => s.removePlanSet);
  const updatePlanSet = useApp((s) => s.updatePlanSet);

  // collapsed cards are compact — easier to drag around
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const allCollapsed =
    !!plan && plan.exercises.length > 0 && plan.exercises.every((e) => collapsed[e.key ?? '']);

  const keyOf = (pe: PlanExercise, fallback: number) => pe.key ?? `idx-${fallback}`;

  const renderItem = useCallback(
    ({ item: pe }: { item: PlanExercise }) => {
      if (!plan) return null;
      const i = plan.exercises.findIndex((e) => e === pe || (pe.key && e.key === pe.key));
      const ex = getExercise(pe.exerciseId);
      const resolvedId = resolveExerciseId(pe.exerciseId, location);
      const swapped = resolvedId !== pe.exerciseId;
      const k = keyOf(pe, i);
      const isCollapsed = !!collapsed[k];
      return (
        <Card style={{ marginBottom: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable
              style={{ flex: 1, paddingRight: 6 }}
              onPress={() => setCollapsed((c) => ({ ...c, [k]: !c[k] }))}>
              <H2>
                {ex.name}{' '}
                <Text style={{ color: C.textFaint, fontSize: F.small }}>
                  {isCollapsed ? '▸' : '▾'}
                </Text>
              </H2>
              {isCollapsed ? (
                <Dim small>
                  {pe.sets.length} set{pe.sets.length === 1 ? '' : 's'}
                  {ex.cardio
                    ? ''
                    : ` · ${pe.sets.map((s) => `${s.weight}×${s.reps}`).join(', ')} · rest ${pe.restSeconds}s`}
                </Dim>
              ) : (
                <Dim small>
                  {ex.muscles.join(', ')} · {ex.equipment}
                </Dim>
              )}
              {swapped && !isCollapsed && (
                <Text style={{ color: C.ember, fontSize: F.small, marginTop: 2 }}>
                  home mode does: {getExercise(resolvedId).name}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => movePlanExercise(plan.id, i, -1)}
              hitSlop={8}
              disabled={i === 0}
              style={{ padding: 6, opacity: i === 0 ? 0.25 : 1 }}>
              <Text style={{ color: C.ember, fontSize: F.h1, fontWeight: '800' }}>↑</Text>
            </Pressable>
            <Pressable
              onPress={() => movePlanExercise(plan.id, i, 1)}
              hitSlop={8}
              disabled={i === plan.exercises.length - 1}
              style={{ padding: 6, opacity: i === plan.exercises.length - 1 ? 0.25 : 1 }}>
              <Text style={{ color: C.ember, fontSize: F.h1, fontWeight: '800' }}>↓</Text>
            </Pressable>
            <Pressable onPress={() => removePlanExercise(plan.id, i)} hitSlop={8} style={{ padding: 6 }}>
              <Text style={{ color: C.red, fontSize: F.h1 }}>✕</Text>
            </Pressable>
          </View>

          {!isCollapsed && (
            <>
              <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 4 }}>
                <Dim small>{'SET'.padEnd(6)}</Dim>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.textFaint, fontSize: F.small, width: 64, textAlign: 'center' }}>
                  {ex.cardio ? 'KM' : unit.toUpperCase()}
                </Text>
                <Text
                  style={{
                    color: C.textFaint,
                    fontSize: F.small,
                    width: 64,
                    textAlign: 'center',
                    marginLeft: 8,
                  }}>
                  {ex.cardio ? 'MIN' : 'REPS'}
                </Text>
                <View style={{ width: 32 }} />
              </View>

              {pe.sets.map((st, si) => (
                <View key={si} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: C.textDim, width: 24 }}>{si + 1}</Text>
                  <View style={{ flex: 1 }} />
                  <View style={{ width: 64 }}>
                    <NumInput
                      value={st.weight}
                      onChange={(n) => updatePlanSet(plan.id, i, si, { weight: n })}
                    />
                  </View>
                  <View style={{ width: 64, marginLeft: 8 }}>
                    <NumInput
                      value={st.reps}
                      onChange={(n) => updatePlanSet(plan.id, i, si, { reps: n })}
                    />
                  </View>
                  <Pressable
                    onPress={() => removePlanSet(plan.id, i, si)}
                    hitSlop={8}
                    style={{ width: 32, alignItems: 'flex-end' }}>
                    <Text style={{ color: C.textFaint }}>—</Text>
                  </Pressable>
                </View>
              ))}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 }}>
                <Btn label="+ Set" kind="ghost" onPress={() => addPlanSet(plan.id, i)} style={{ flex: 1 }} />
                {!ex.cardio && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Dim small>Rest</Dim>
                    <NumInput
                      value={pe.restSeconds}
                      onChange={(n) => setPlanRest(plan.id, i, Math.max(0, Math.round(n)))}
                    />
                    <Dim small>sec</Dim>
                  </View>
                )}
              </View>
              {i < plan.exercises.length - 1 && !ex.cardio && (
                <Pressable
                  onPress={() => togglePlanSuperset(plan.id, i)}
                  hitSlop={6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    backgroundColor: pe.supersetWithNext ? C.redDark : C.cardAlt,
                    borderWidth: 1,
                    borderColor: pe.supersetWithNext ? C.red : C.border,
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}>
                  <Text style={{ color: pe.supersetWithNext ? '#fff' : C.textDim, fontSize: F.small, fontWeight: '600' }}>
                    {pe.supersetWithNext ? 'Superset with next ✓' : 'Superset with next'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Card>
      );
    },
    [plan, location, collapsed]
  );

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <Dim>This plan no longer exists.</Dim>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: plan.name }} />
      {/* ── editing-mode frame ── */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* red tint wash */}
        <View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: 'rgba(180,20,20,0.07)',
            pointerEvents: 'none',
          }}
        />
        {/* dashed border inset from edges */}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
            borderWidth: 1.5,
            borderColor: 'rgba(220,50,50,0.55)',
            borderStyle: 'dashed',
            borderRadius: 16,
            pointerEvents: 'none',
          }}
        />
        {/* EDIT MODE badge */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 20,
            backgroundColor: 'rgba(180,20,20,0.82)',
            borderRadius: 6,
            paddingVertical: 2,
            paddingHorizontal: 8,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <Text style={{ color: '#fff', fontSize: F.small - 1, fontWeight: '800', letterSpacing: 1 }}>
            EDIT MODE
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 + insets.bottom }}
          keyboardShouldPersistTaps="handled">
        <Dim small>PLAN NAME</Dim>
        <TextInput
          defaultValue={plan.name}
          onEndEditing={(e) => {
            const t = e.nativeEvent.text.trim();
            if (t) renamePlan(plan.id, t);
          }}
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 10,
            color: C.text,
            fontSize: F.h2,
            fontWeight: '700',
            padding: 12,
            marginTop: 6,
            marginBottom: 10,
          }}
          placeholder="Plan name"
          placeholderTextColor={C.textFaint}
        />

        {plan.note && <Dim>{plan.note}</Dim>}

        {plan.exercises.length > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Btn
              label={allCollapsed ? 'Expand all' : 'Collapse all'}
              kind="ghost"
              onPress={() => {
                const next: Record<string, boolean> = {};
                plan.exercises.forEach((e, i) => {
                  next[keyOf(e, i)] = !allCollapsed;
                });
                setCollapsed(next);
              }}
            />
            <Dim small>Hold & drag a card to reorder</Dim>
          </View>
        )}

        <Sortable.Grid
          columns={1}
          rowGap={12}
          data={plan.exercises}
          keyExtractor={(item: PlanExercise) => item.key ?? item.exerciseId}
          renderItem={renderItem}
          onDragEnd={({ data }) => setPlanExercises(plan.id, data)}
        />

        <Btn
          label="+ Add Exercises"
          style={{ marginTop: 16 }}
          onPress={() =>
            router.push({ pathname: '/exercise-picker', params: { target: 'plan', planId: plan.id } })
          }
        />
        <ConfirmBtn
          label="Delete Plan"
          confirmLabel="Tap again to delete forever"
          style={{ marginTop: 12 }}
          onConfirm={() => {
            deletePlan(plan.id);
            router.back();
          }}
        />
        </ScrollView>
      </View>
    </>
  );
}
