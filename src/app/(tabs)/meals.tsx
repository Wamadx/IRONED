import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, NumInput, Title, TrashConfirm } from '@/components/ui';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? C.red : C.cardAlt,
        borderWidth: 1,
        borderColor: selected ? C.red : C.border,
        borderRadius: 14,
        paddingVertical: 6,
        paddingHorizontal: 12,
      }}>
      <Text style={{ color: selected ? '#fff' : C.textDim, fontSize: F.small }}>{label}</Text>
    </Pressable>
  );
}

const ACTIVITY = [
  { label: 'Sedentary', factor: 1.2 },
  { label: 'Light (1-3x/wk)', factor: 1.375 },
  { label: 'Moderate (3-5x/wk)', factor: 1.55 },
  { label: 'Very active', factor: 1.725 },
];

const AIMS = ['Cut', 'Maintain', 'Bulk'] as const;
/** kg per week gained/lost; ~7700 kcal per kg of body weight */
const RATES = [0.25, 0.5, 0.75];
const KCAL_PER_KG = 7700;

/** Mifflin-St Jeor TDEE calculator → suggested macro goals, rate-based surplus/deficit. */
function GoalCalculator({
  onApply,
}: {
  onApply: (g: { kcal: number; protein: number; carbs: number; fat: number }) => void;
}) {
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(75);
  const [activity, setActivity] = useState(2);
  const [aim, setAim] = useState(1);
  const [rate, setRate] = useState(0.25);
  const [targetKg, setTargetKg] = useState(0);
  const [result, setResult] = useState('');

  const compute = () => {
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);
    const tdee = bmr * ACTIVITY[activity].factor;
    const dailyDelta = aim === 1 ? 0 : (rate * KCAL_PER_KG) / 7;
    const kcal = Math.round((tdee + (aim === 0 ? -dailyDelta : aim === 2 ? dailyDelta : 0)) / 10) * 10;
    const protein = Math.round(1.8 * weightKg);
    const fat = Math.round((kcal * 0.25) / 9);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    onApply({ kcal, protein, carbs, fat });

    let msg = `Maintenance ≈ ${Math.round(tdee / 10) * 10} kcal`;
    if (aim !== 1) {
      msg += ` ${aim === 0 ? '−' : '+'}${Math.round(dailyDelta)} kcal/day for ${rate} kg/week`;
      if (targetKg > 0 && targetKg !== weightKg) {
        const weeks = Math.ceil(Math.abs(targetKg - weightKg) / rate);
        const eta = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000);
        msg += `\n→ ${weightKg} → ${targetKg} kg in ≈ ${weeks} weeks (${eta.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})`;
      }
    }
    setResult(msg + `\nApplied: ${kcal} kcal · P ${protein} · C ${carbs} · F ${fat}`);
  };

  return (
    <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
      <H2>Calculate my goals</H2>
      <Dim small>Mifflin-St Jeor formula — a solid starting point, adjust as you learn your body.</Dim>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        <Chip label="Male" selected={sex === 'm'} onPress={() => setSex('m')} />
        <Chip label="Female" selected={sex === 'f'} onPress={() => setSex('f')} />
      </View>
      {(
        [
          ['Age', age, setAge],
          ['Height (cm)', heightCm, setHeightCm],
          ['Weight (kg)', weightKg, setWeightKg],
        ] as const
      ).map(([label, value, setter]) => (
        <View
          key={label}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Dim>{label}</Dim>
          <NumInput value={value} onChange={(n) => setter(Math.round(n))} />
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ACTIVITY.map((a, i) => (
          <Chip key={a.label} label={a.label} selected={activity === i} onPress={() => setActivity(i)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {AIMS.map((g, i) => (
          <Chip key={g} label={g} selected={aim === i} onPress={() => setAim(i)} />
        ))}
      </View>
      {aim !== 1 && (
        <>
          <Dim small>
            {'\n'}
            {aim === 0 ? 'Lose' : 'Gain'} per week
          </Dim>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {RATES.map((r) => (
              <Chip
                key={r}
                label={`${r} kg/wk`}
                selected={rate === r}
                onPress={() => setRate(r)}
              />
            ))}
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Dim>Target weight (kg, optional)</Dim>
            <NumInput value={targetKg} onChange={(n) => setTargetKg(Math.round(n))} />
          </View>
        </>
      )}
      <Btn label="Calculate & apply" icon="calculator-outline" style={{ marginTop: 12 }} onPress={compute} />
      {result !== '' && <Dim small>{'\n' + result}</Dim>}
    </View>
  );
}

function GoalBar({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const over = value > goal;
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: C.text, fontWeight: '700', fontSize: F.body }}>{label}</Text>
        <Text style={{ color: over ? C.ember : C.textDim, fontSize: F.body }}>
          {Math.round(value)} / {goal} {unit}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: C.cardAlt, borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
        <View
          style={{
            width: `${Math.min(100, (value / Math.max(1, goal)) * 100)}%`,
            height: '100%',
            backgroundColor: over ? C.ember : C.red,
          }}
        />
      </View>
    </View>
  );
}

export default function Meals() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const meals = useApp((s) => s.meals);
  const goals = useApp((s) => s.macroGoals);
  const setMacroGoals = useApp((s) => s.setMacroGoals);
  const deleteMeal = useApp((s) => s.deleteMeal);
  const toggleFavoriteMeal = useApp((s) => s.toggleFavoriteMeal);
  const waterLog = useApp((s) => s.waterLog);
  const waterGoal = useApp((s) => s.waterGoal);
  const setWaterGoal = useApp((s) => s.setWaterGoal);
  const addWater = useApp((s) => s.addWater);
  const undoWater = useApp((s) => s.undoWater);

  const [editGoals, setEditGoals] = useState(false);
  // bumping this remounts the goal inputs so calculator results show up in them
  const [applyCount, setApplyCount] = useState(0);

  const now = Date.now();
  const today = meals.filter((m) => sameDay(m.time, now));
  const sum = (k: 'kcal' | 'protein' | 'carbs' | 'fat' | 'sodium') =>
    today.reduce((a, m) => a + (m[k] ?? 0), 0);

  // group meals by local day; only today is expanded by default
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const dayKeyOf = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };
  const groups: { key: string; label: string; isToday: boolean; meals: typeof meals }[] = [];
  for (const m of meals) {
    const key = dayKeyOf(m.time);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = {
        key,
        isToday: sameDay(m.time, now),
        label: new Date(m.time)
          .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
          .toUpperCase(),
        meals: [],
      };
      groups.push(g);
    }
    g.meals.push(m);
  }
  const waterToday = waterLog.filter((w) => sameDay(w.time, now)).reduce((a, w) => a + w.ml, 0);
  const lastWaterIsToday =
    waterLog.length > 0 && sameDay(waterLog[waterLog.length - 1].time, now);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        paddingBottom: 32 + insets.bottom,
      }}
      keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>MEALS</Title>
        {/* single place to edit every nutrition goal */}
        <Pressable onPress={() => setEditGoals((v) => !v)} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons
            name={editGoals ? 'checkmark-circle' : 'options-outline'}
            size={24}
            color={editGoals ? C.red : C.textDim}
          />
        </Pressable>
      </View>
      <Dim>
        {today.length} meal{today.length === 1 ? '' : 's'} logged today
      </Dim>

      {editGoals && (
        <Card style={{ marginTop: 16, borderColor: C.red }}>
          <H2>Goals</H2>
          <View style={{ marginTop: 8, gap: 8 }}>
            {(
              [
                ['Calories (kcal)', 'kcal'],
                ['Protein (g)', 'protein'],
                ['Carbs (g)', 'carbs'],
                ['Fat (g)', 'fat'],
                ['Sodium (mg)', 'sodium'],
              ] as const
            ).map(([label, key]) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Dim>{label}</Dim>
                <NumInput
                  key={`${key}-${applyCount}`}
                  value={goals[key]}
                  onChange={(n) => setMacroGoals({ ...goals, [key]: Math.max(0, Math.round(n)) })}
                />
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Dim>Water (ml)</Dim>
              <NumInput value={waterGoal} onChange={(n) => setWaterGoal(n)} />
            </View>
          </View>
          <GoalCalculator
            onApply={(g) => {
              setMacroGoals({ ...g, sodium: goals.sodium ?? 2300 });
              setApplyCount((c) => c + 1);
            }}
          />
        </Card>
      )}

      <Card style={{ marginTop: 16 }}>
        <H2>Today’s goals</H2>
        <GoalBar label="Calories" value={sum('kcal')} goal={goals.kcal} unit="kcal" />
        <GoalBar label="Protein" value={sum('protein')} goal={goals.protein} unit="g" />
        <GoalBar label="Carbs" value={sum('carbs')} goal={goals.carbs} unit="g" />
        <GoalBar label="Fat" value={sum('fat')} goal={goals.fat} unit="g" />
        <GoalBar label="Sodium" value={sum('sodium')} goal={goals.sodium ?? 2300} unit="mg" />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="water" size={18} color={C.red} />
          <H2>Water</H2>
        </View>
        <GoalBar label="Today" value={waterToday} goal={waterGoal} unit="ml" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Btn label="+250" kind="ghost" style={{ flex: 1 }} onPress={() => addWater(250)} />
          <Btn label="+500" kind="ghost" style={{ flex: 1 }} onPress={() => addWater(500)} />
          <Btn label="+1L" kind="ghost" style={{ flex: 1 }} onPress={() => addWater(1000)} />
          {lastWaterIsToday && (
            <Btn label="undo" kind="ghost" style={{ flex: 1 }} onPress={undoWater} />
          )}
        </View>
      </Card>

      <Btn
        label="Log a Meal (camera or manual)"
        icon="add-circle-outline"
        onPress={() => router.push('/meal-add')}
      />

      {groups.map((g) => {
        const open = g.isToday || !!expandedDays[g.key];
        const dayKcal = g.meals.reduce((a, m) => a + m.kcal, 0);
        return (
          <View key={g.key}>
            {g.isToday ? (
              <Dim small>{'\n'}TODAY</Dim>
            ) : (
              <Pressable
                onPress={() => setExpandedDays((cur) => ({ ...cur, [g.key]: !cur[g.key] }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: C.cardAlt,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginTop: 12,
                }}>
                <Text style={{ color: C.textDim, fontSize: F.small, fontWeight: '700' }}>
                  {g.label} · {g.meals.length} meal{g.meals.length === 1 ? '' : 's'} · {dayKcal} kcal
                </Text>
                <Ionicons
                  name={open ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color={C.textFaint}
                />
              </Pressable>
            )}
            {open &&
              g.meals.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => router.push({ pathname: '/meal/[id]', params: { id: m.id } })}>
                  {({ pressed }) => (
                    <Card style={{ marginTop: 8, opacity: pressed ? 0.7 : 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {m.photoUri && (
                          <Image
                            source={{ uri: m.photoUri }}
                            style={{ width: 48, height: 48, borderRadius: 8, marginRight: 10, backgroundColor: C.cardAlt }}
                            contentFit="cover"
                          />
                        )}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ color: C.text, fontWeight: '700', fontSize: F.body }}>
                            {m.desc}
                          </Text>
                          <Dim small>
                            {new Date(m.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ·{' '}
                            {m.kcal} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                            {m.sodium ? ` · Na ${m.sodium}mg` : ''}
                          </Dim>
                        </View>
                        <Pressable
                          hitSlop={8}
                          onPress={() => toggleFavoriteMeal(m.id)}
                          style={{ marginRight: 10 }}>
                          <Ionicons
                            name={m.favorite ? 'star' : 'star-outline'}
                            size={18}
                            color={m.favorite ? C.ember : C.textFaint}
                          />
                        </Pressable>
                        <TrashConfirm onDelete={() => deleteMeal(m.id)} />
                      </View>
                    </Card>
                  )}
                </Pressable>
              ))}
          </View>
        );
      })}

      {meals.length === 0 && (
        <Card style={{ marginTop: 12 }}>
          <Dim>Nothing logged yet. Snap a photo of your food and let the AI break it down.</Dim>
        </Card>
      )}
    </ScrollView>
  );
}
