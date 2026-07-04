import { getExercise } from './exercises';
import { doneSets, workoutVolume } from './store';
import type { Workout, WorkoutExercise } from './types';

/** cardio totals across done sets — reps = minutes, weight = km */
function cardioTotals(w: Workout): { min: number; km: number } {
  let min = 0;
  let km = 0;
  for (const e of w.exercises) {
    if (!getExercise(e.exerciseId).cardio) continue;
    for (const s of e.sets) {
      if (!s.done) continue;
      min += s.reps;
      km += s.weight;
    }
  }
  return { min, km };
}

/** XP for one finished workout. */
export function workoutXp(w: Workout): number {
  const sets = doneSets(w.exercises);
  if (sets === 0) return 0;
  const volumeBonus = Math.min(200, Math.floor(workoutVolume(w.exercises) / 100));
  const { min } = cardioTotals(w);
  return 50 + sets * 5 + volumeBonus + Math.min(120, min * 2);
}

export const PR_XP = 25;
export const PR_XP_CAP = 75;

export interface PR {
  exerciseId: string;
  weight: number;
  reps: number;
}

/** best set of an exercise scored by estimated 1RM (Epley) */
function bestSet(ex: WorkoutExercise): { score: number; weight: number; reps: number } | null {
  let best: { score: number; weight: number; reps: number } | null = null;
  for (const s of ex.sets) {
    if (!s.done || s.weight <= 0 || s.reps <= 0) continue;
    const score = s.weight * (1 + s.reps / 30);
    if (!best || score > best.score) best = { score, weight: s.weight, reps: s.reps };
  }
  return best;
}

/**
 * PRs set in the given workout vs everything before it (workouts array is newest-first).
 * The first-ever performance of an exercise is a baseline, not a PR.
 */
export function workoutPRs(workouts: Workout[], workoutId: string): PR[] {
  const idx = workouts.findIndex((w) => w.id === workoutId);
  if (idx < 0) return [];
  const prior = workouts.slice(idx + 1);
  const prs: PR[] = [];
  const seen = new Set<string>();
  for (const e of workouts[idx].exercises) {
    if (seen.has(e.exerciseId) || getExercise(e.exerciseId).cardio) continue;
    seen.add(e.exerciseId);
    const best = bestSet(e);
    if (!best) continue;
    let priorBest = 0;
    for (const pw of prior) {
      for (const pe of pw.exercises) {
        if (pe.exerciseId !== e.exerciseId) continue;
        const b = bestSet(pe);
        if (b && b.score > priorBest) priorBest = b.score;
      }
    }
    if (priorBest > 0 && best.score > priorBest) {
      prs.push({ exerciseId: e.exerciseId, weight: best.weight, reps: best.reps });
    }
  }
  return prs;
}

export function prBonus(prCount: number): number {
  return Math.min(PR_XP_CAP, prCount * PR_XP);
}

export function totalPRCount(workouts: Workout[]): number {
  return workouts.reduce((n, w) => n + workoutPRs(workouts, w.id).length, 0);
}

export function totalXp(workouts: Workout[]): number {
  return workouts.reduce(
    (sum, w) => sum + workoutXp(w) + prBonus(workoutPRs(workouts, w.id).length),
    0
  );
}

/** cumulative XP required to REACH level l (level 1 = 0) */
export function xpForLevel(l: number): number {
  return Math.floor(100 * Math.pow(l - 1, 1.5));
}

export interface LevelInfo {
  level: number;
  xp: number;
  intoLevel: number;
  neededForNext: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, xp, intoLevel: xp - cur, neededForNext: next - cur };
}

export interface Rank {
  letter: string;
  title: string;
  minLevel: number;
}

export const RANKS: Rank[] = [
  { letter: 'E', title: 'Unawakened Hunter', minLevel: 1 },
  { letter: 'D', title: 'Awakened Hunter', minLevel: 10 },
  { letter: 'C', title: 'Elite Hunter', minLevel: 20 },
  { letter: 'B', title: 'Vice-Guild Master', minLevel: 35 },
  { letter: 'A', title: 'National-Level Hunter', minLevel: 55 },
  { letter: 'S', title: 'Shadow Monarch', minLevel: 80 },
];

export function rankFor(level: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.minLevel) r = rank;
  return r;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}

export interface HunterStats {
  str: number;
  agi: number;
  vit: number;
}

/** Stats grown from actual training: STR = volume, AGI = cardio, VIT = consistency. */
export function hunterStats(workouts: Workout[]): HunterStats {
  let volume = 0;
  let sets = 0;
  let min = 0;
  let km = 0;
  for (const w of workouts) {
    volume += workoutVolume(w.exercises);
    sets += doneSets(w.exercises);
    const c = cardioTotals(w);
    min += c.min;
    km += c.km;
  }
  return {
    str: Math.floor(Math.sqrt(volume / 50)),
    agi: Math.floor(Math.sqrt(km * 8 + min)),
    vit: Math.floor(Math.sqrt(sets * 2 + workouts.length * 5)),
  };
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const DAY = 24 * 3600 * 1000;

/** predicate: is this date a scheduled rest day? (works for weekly AND cycle schedules) */
export type IsRestDay = (ts: number) => boolean;

/**
 * Longest on-track run ever. Scheduled rest days keep a streak alive;
 * a run must contain at least one actual workout.
 */
export function maxStreak(workouts: Workout[], isRest: IsRestDay = () => false): number {
  if (workouts.length === 0) return 0;
  const days = new Set(workouts.map((w) => dayKey(w.finishedAt)));
  const first = Math.min(...workouts.map((w) => w.finishedAt));
  let best = 0;
  let run = 0;
  let hasWorkout = false;
  for (let ts = first; ts <= Date.now() + DAY / 2; ts += DAY) {
    if (days.has(dayKey(ts))) {
      run++;
      hasWorkout = true;
    } else if (isRest(ts)) {
      run++;
    } else {
      if (hasWorkout) best = Math.max(best, run);
      run = 0;
      hasWorkout = false;
    }
  }
  if (hasWorkout) best = Math.max(best, run);
  return best;
}

export interface Achievement {
  id: string;
  /** Ionicons glyph name */
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  /** completed tiers */
  tier: number;
  maxTier: number;
  /** 0..1 progress toward the next tier (1 when maxed) */
  progress: number;
}

const ROMAN = ['', ' I', ' II', ' III', ' IV', ' V', ' VI'];

/**
 * Evolving achievements: every category is a ladder — reaching a tier immediately
 * reveals the next target, so there is always something to chase.
 */
export function achievements(
  workouts: Workout[],
  mealCount: number,
  isRest: IsRestDay = () => false
): Achievement[] {
  let volume = 0;
  let km = 0;
  for (const w of workouts) {
    volume += workoutVolume(w.exercises);
    for (const e of w.exercises) {
      if (!getExercise(e.exerciseId).cardio) continue;
      for (const s of e.sets) if (s.done) km += s.weight;
    }
  }
  const ladders: {
    id: string;
    icon: string;
    title: string;
    unit: string;
    value: number;
    thresholds: number[];
  }[] = [
    { id: 'hunter', icon: 'flash', title: 'Hunter', unit: 'workouts', value: workouts.length, thresholds: [1, 10, 25, 50, 100, 250] },
    { id: 'records', icon: 'trophy', title: 'Record Breaker', unit: 'PRs', value: totalPRCount(workouts), thresholds: [1, 5, 15, 30, 60, 100] },
    { id: 'streak', icon: 'flame', title: 'Unbroken', unit: 'day streak', value: maxStreak(workouts, isRest), thresholds: [3, 7, 14, 30, 60, 100] },
    { id: 'volume', icon: 'barbell', title: 'Ton Lifter', unit: 'kg lifted', value: Math.round(volume), thresholds: [1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000] },
    { id: 'roadwork', icon: 'walk', title: 'Roadwork', unit: 'km cardio', value: Math.round(km), thresholds: [5, 20, 42, 100, 250, 500] },
    { id: 'fuel', icon: 'restaurant', title: 'Fuel Manager', unit: 'meals logged', value: mealCount, thresholds: [5, 25, 75, 200, 500, 1000] },
  ];
  return ladders.map((l) => {
    const tier = l.thresholds.filter((t) => l.value >= t).length;
    const next = l.thresholds[tier];
    const prev = tier > 0 ? l.thresholds[tier - 1] : 0;
    return {
      id: l.id,
      icon: l.icon,
      title: `${l.title}${ROMAN[Math.min(tier, ROMAN.length - 1)]}`,
      desc:
        next !== undefined
          ? `${l.value.toLocaleString()} / ${next.toLocaleString()} ${l.unit}`
          : `MAX · ${l.value.toLocaleString()} ${l.unit}`,
      unlocked: tier > 0,
      tier,
      maxTier: l.thresholds.length,
      progress: next !== undefined ? Math.min(1, (l.value - prev) / (next - prev)) : 1,
    };
  });
}

/**
 * Consecutive on-track days ending today or yesterday. Scheduled rest days
 * count toward the streak instead of breaking it, as long as the run
 * contains at least one real workout.
 */
export function currentStreak(workouts: Workout[], isRest: IsRestDay = () => false): number {
  const days = new Set(workouts.map((w) => dayKey(w.finishedAt)));
  if (days.size === 0) return 0;
  const ok = (ts: number) => days.has(dayKey(ts)) || isRest(ts);
  let cursor = Date.now();
  // today doesn't break the streak while it's still pending
  if (!ok(cursor)) cursor -= DAY;
  let streak = 0;
  let hasWorkout = false;
  while (ok(cursor) && streak < 3650) {
    if (days.has(dayKey(cursor))) hasWorkout = true;
    streak++;
    cursor -= DAY;
  }
  return hasWorkout ? streak : 0;
}
