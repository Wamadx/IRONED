import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, Title } from '@/components/ui';
import { RankPet } from '@/components/pet';
import { getExercise } from '@/lib/exercises';
import { slotForDate } from '@/lib/schedule';
import { doneSets, useApp, workoutVolume } from '@/lib/store';
import { C, F } from '@/lib/theme';
import {
  achievements,
  currentStreak,
  hunterStats,
  levelInfo,
  nextRank,
  prBonus,
  rankFor,
  totalPRCount,
  totalXp,
  workoutPRs,
  workoutXp,
} from '@/lib/xp';

function Bar({ ratio }: { ratio: number }) {
  return (
    <View style={{ height: 8, backgroundColor: C.cardAlt, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
      <View
        style={{
          width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
          height: '100%',
          backgroundColor: C.red,
        }}
      />
    </View>
  );
}

function StatRow({
  label,
  icon,
  value,
  hint,
}: {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: number;
  hint: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
      <View style={{ width: 44 }}>
        {icon ? (
          <Ionicons name={icon} size={20} color={C.ember} />
        ) : (
          <Text style={{ color: C.ember, fontWeight: '800', fontSize: F.h2 }}>{label}</Text>
        )}
      </View>
      <Text style={{ color: C.text, fontWeight: '800', fontSize: F.h2, width: 48 }}>{value}</Text>
      <Dim small>{hint}</Dim>
    </View>
  );
}

/** Estimated-1RM trend for the most-trained lifts — pick an exercise, see the last 10 sessions. */
function OneRmTrend({ workouts }: { workouts: ReturnType<typeof useApp.getState>['workouts'] }) {
  // count sessions per non-cardio exercise
  const counts = new Map<string, number>();
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (getExercise(e.exerciseId).cardio) continue;
      if (e.sets.some((s) => s.done && s.weight > 0)) {
        counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
      }
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  const [picked, setPicked] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const exId = picked ?? top[0];
  if (!exId) return null;

  // best est-1RM per workout, oldest → newest, last 10
  const points: { v: number; time: number }[] = [];
  for (let i = workouts.length - 1; i >= 0; i--) {
    const e = workouts[i].exercises.find((x) => x.exerciseId === exId);
    if (!e) continue;
    let best = 0;
    for (const s of e.sets) {
      if (!s.done || s.weight <= 0) continue;
      best = Math.max(best, s.weight * (1 + s.reps / 30));
    }
    if (best > 0) points.push({ v: Math.round(best), time: workouts[i].finishedAt });
  }
  const recent = points.slice(-10);
  const max = Math.max(...recent.map((p) => p.v), 1);
  const delta = recent.length >= 2 ? recent[recent.length - 1].v - recent[0].v : 0;
  const selPoint = sel !== null ? recent[sel] : null;

  return (
    <Card>
      <H2>Est. 1RM trend</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {top.map((id) => (
          <Pressable
            key={id}
            onPress={() => {
              setPicked(id);
              setSel(null);
            }}
            style={{
              backgroundColor: exId === id ? C.red : C.cardAlt,
              borderWidth: 1,
              borderColor: exId === id ? C.red : C.border,
              borderRadius: 14,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}>
            <Text style={{ color: exId === id ? '#fff' : C.textDim, fontSize: F.small }}>
              {getExercise(id).name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 4, marginTop: 12 }}>
        {recent.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => setSel((cur) => (cur === i ? null : i))}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Dim small>{i === recent.length - 1 ? p.v : ''}</Dim>
            <View
              style={{
                width: '65%',
                height: Math.max(3, (p.v / max) * 52),
                borderRadius: 3,
                backgroundColor: sel === i ? C.ember : i === recent.length - 1 ? C.red : C.redDark,
                borderWidth: sel === i ? 1 : 0,
                borderColor: '#fff',
              }}
            />
          </Pressable>
        ))}
      </View>
      <Dim small>
        {selPoint
          ? `${new Date(selPoint.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: est 1RM ${selPoint.v}`
          : `Last ${recent.length} sessions${delta !== 0 ? ` · ${delta > 0 ? '+' : ''}${delta} since first shown` : ''}`}
      </Dim>
    </Card>
  );
}

export default function Hunter() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const workouts = useApp((s) => s.workouts);
  const meals = useApp((s) => s.meals);
  const macroGoals = useApp((s) => s.macroGoals);
  const schedule = useApp((s) => s.schedule);
  const scheduleMode = useApp((s) => s.scheduleMode);
  const cycle = useApp((s) => s.cycle);
  const cycleStart = useApp((s) => s.cycleStart);

  // scheduled rest days keep streaks alive — weekly or rotating-cycle mode
  const isRest = (ts: number) => slotForDate(scheduleMode, schedule, cycle, cycleStart, ts) === 'rest';
  const hasRestDays =
    scheduleMode === 'cycle' ? cycle.includes('rest') : schedule.includes('rest');
  const [volSel, setVolSel] = useState<number | null>(null);

  const xp = totalXp(workouts);
  const lvl = levelInfo(xp);
  const rank = rankFor(lvl.level);
  const next = nextRank(lvl.level);
  const stats = hunterStats(workouts);
  const streak = currentStreak(workouts, isRest);
  const prCount = totalPRCount(workouts);
  const badges = achievements(workouts, meals.length, isRest);

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const weekWorkouts = workouts.filter((w) => w.finishedAt > weekAgo);
  const weekXp = weekWorkouts.reduce(
    (s, w) => s + workoutXp(w) + prBonus(workoutPRs(workouts, w.id).length),
    0
  );
  const weekVolume = weekWorkouts.reduce((s, w) => s + workoutVolume(w.exercises), 0);
  const weekSets = weekWorkouts.reduce((s, w) => s + doneSets(w.exercises), 0);
  const weekMeals = meals.filter((m) => m.time > weekAgo);
  const mealDays = new Set(weekMeals.map((m) => new Date(m.time).toDateString()));
  const avgKcal =
    mealDays.size > 0
      ? Math.round(weekMeals.reduce((s, m) => s + m.kcal, 0) / mealDays.size)
      : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        paddingBottom: 32 + insets.bottom,
      }}>
      <Title>HUNTER STATUS</Title>

      <Card style={{ marginTop: 16, alignItems: 'center', borderColor: C.redDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: C.red,
                fontSize: 84,
                fontWeight: '900',
                textShadowColor: C.red,
                textShadowRadius: 24,
                lineHeight: 96,
              }}>
              {rank.letter}
            </Text>
          </View>
          <RankPet rank={rank.letter} />
        </View>
        <Text style={{ color: C.text, fontSize: F.h1, fontWeight: '800', letterSpacing: 1 }}>
          {rank.title.toUpperCase()}
        </Text>
        <Dim small>RANK {rank.letter} HUNTER</Dim>

        <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>Level {lvl.level}</H2>
            <Dim small>
              {lvl.intoLevel} / {lvl.neededForNext} XP
            </Dim>
          </View>
          <Bar ratio={lvl.intoLevel / lvl.neededForNext} />
          <Dim small>
            {xp.toLocaleString()} total XP
            {next ? ` · rank ${next.letter} at level ${next.minLevel}` : ' · maximum rank reached'}
          </Dim>
        </View>
      </Card>

      <Card>
        <H2>Stats</H2>
        <StatRow label="STR" value={stats.str} hint="grows with total volume lifted" />
        <StatRow label="AGI" value={stats.agi} hint="grows with cardio distance & time" />
        <StatRow label="VIT" value={stats.vit} hint="grows with sets & consistency" />
      </Card>

      <Card>
        <H2>Consistency</H2>
        <StatRow
          icon="flame"
          value={streak}
          hint={`day streak${hasRestDays ? ' (scheduled rest days count)' : streak === 0 ? ' — train today to start one' : ''}`}
        />
        <StatRow icon="trophy" value={prCount} hint="personal records (+25 XP each)" />
      </Card>

      <Card>
        <H2>Volume — last 8 weeks</H2>
        {(() => {
          const WEEK = 7 * 24 * 3600 * 1000;
          const now = Date.now();
          const weeks = Array.from({ length: 8 }, (_, i) => {
            const start = now - (8 - i) * WEEK;
            const inWeek = workouts.filter((w) => w.finishedAt >= start && w.finishedAt < start + WEEK);
            return {
              start,
              vol: inWeek.reduce((s, w) => s + workoutVolume(w.exercises), 0),
              count: inWeek.length,
            };
          });
          const max = Math.max(...weeks.map((w) => w.vol), 1);
          const fmtD = (ts: number) =>
            new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const sel = volSel !== null ? weeks[volSel] : null;
          return (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4, marginTop: 10 }}>
                {weeks.map((w, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setVolSel((cur) => (cur === i ? null : i))}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <View
                      style={{
                        width: '70%',
                        height: Math.max(3, (w.vol / max) * 72),
                        borderRadius: 4,
                        backgroundColor: volSel === i ? C.ember : i === weeks.length - 1 ? C.red : C.redDark,
                        borderWidth: volSel === i ? 1 : 0,
                        borderColor: '#fff',
                      }}
                    />
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Dim small>8w ago</Dim>
                <Dim small>{Math.round(weeks[weeks.length - 1].vol).toLocaleString()} this week</Dim>
              </View>
              {sel && (
                <Dim small>
                  {fmtD(sel.start)} – {fmtD(sel.start + WEEK - 1)}: {Math.round(sel.vol).toLocaleString()} volume ·{' '}
                  {sel.count} workout{sel.count === 1 ? '' : 's'}
                </Dim>
              )}
            </>
          );
        })()}
      </Card>

      <OneRmTrend workouts={workouts} />

      <Btn
        label="Body measurements & progress photos"
        icon="body-outline"
        kind="ghost"
        style={{ marginBottom: 12 }}
        onPress={() => router.push('/measurements')}
      />

      <Card>
        <H2>Hunter Weekly Report</H2>
        <Dim small>Last 7 days</Dim>
        <Dim>
          {weekWorkouts.length} workout{weekWorkouts.length === 1 ? '' : 's'} · {weekSets} sets ·{' '}
          {Math.round(weekVolume).toLocaleString()} kg volume
        </Dim>
        <Dim>+{weekXp} XP earned</Dim>
        <Dim>
          {avgKcal !== null
            ? `Avg ${avgKcal} kcal/day vs ${macroGoals.kcal} goal (${mealDays.size} day${mealDays.size === 1 ? '' : 's'} logged)`
            : 'No meals logged this week'}
        </Dim>
      </Card>

      <Card>
        <H2>Achievements</H2>
        <Dim small>Every badge evolves — hit a tier and the next target appears.</Dim>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {badges.map((b) => (
            <View
              key={b.id}
              style={{
                width: '48%',
                marginRight: '2%',
                marginTop: 8,
                backgroundColor: C.cardAlt,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: b.unlocked ? C.redDark : C.border,
                padding: 10,
                opacity: b.unlocked ? 1 : 0.55,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Ionicons
                  name={b.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={b.unlocked ? C.ember : C.textFaint}
                />
                <Text style={{ color: C.textFaint, fontSize: F.small }}>
                  {b.tier}/{b.maxTier}
                </Text>
              </View>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: F.small, marginTop: 4 }}>
                {b.title}
              </Text>
              <Text style={{ color: C.textDim, fontSize: F.small }}>{b.desc}</Text>
              <View
                style={{
                  height: 4,
                  backgroundColor: C.card,
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginTop: 6,
                }}>
                <View
                  style={{
                    width: `${Math.round(b.progress * 100)}%`,
                    height: '100%',
                    backgroundColor: b.progress >= 1 ? C.good : C.red,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {workouts.length === 0 && (
        <Card>
          <Dim>Finish your first workout to start earning XP. Arise.</Dim>
        </Card>
      )}

    </ScrollView>
  );
}
