import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EASY_VARIATION, EXERCISES, getExercise, MACHINE_SWAP, resolveExerciseId } from './exercises';
import { generatePlans, uid } from './physique';
import type { AccentId, BgId, FontScaleId, UiFlavor } from './theme';
import type {
  ActiveWorkout,
  MacroGoals,
  Meal,
  Measurement,
  MetricId,
  Plan,
  PhysiqueGoalId,
  Profile,
  ProgressPhoto,
  SetLog,
  SetTarget,
  TrainLocation,
  Workout,
  WorkoutExercise,
} from './types';

const DEFAULT_GOALS: MacroGoals = { kcal: 2500, protein: 150, carbs: 250, fat: 80, sodium: 2300 };

interface AppState {
  hydrated: boolean;
  profile: Profile;
  plans: Plan[];
  workouts: Workout[];
  active: ActiveWorkout | null;
  meals: Meal[];
  macroGoals: MacroGoals;
  waterLog: { time: number; ml: number }[];
  waterGoal: number;

  /** display + plate-calc unit; numbers are stored as entered, no conversion */
  unit: 'kg' | 'lb';
  /** bar weight for the plate calculator, in the current unit */
  barWeight: number;
  /** user-provided API keys (override the baked-in dev keys) */
  apiKeys: { exercisedb: string; gemini: string };
  /** equipment the user has at home for filtering */
  homeEquipment: { barbell: boolean; dumbbell: boolean; "pull-up bar": boolean; bench: boolean; band: boolean; "medicine ball": boolean };
  /** weekly split: index = JS getDay() (0=Sun) → planId | 'rest' | null */
  schedule: (string | null)[];
  /** rotating cycle mode (e.g. 5-day UA/LA/UB/LB/Rest repeating regardless of weekday) */
  scheduleMode: 'weekly' | 'cycle';
  cycle: string[];
  cycleStart: number;
  remindersEnabled: boolean;
  reminderHour: number;
  accent: AccentId;
  bgTheme: BgId;
  fontScale: FontScaleId;
  uiFlavor: UiFlavor;
  pageAnimations: boolean;
  greeting: string;
  measurements: Measurement[];
  progressPhotos: ProgressPhoto[];

  setGoal: (goal: PhysiqueGoalId, location: TrainLocation) => void;
  setLocation: (location: TrainLocation) => void;
  finishOnboarding: () => void;

  createPlan: (name: string) => string;
  renamePlan: (id: string, name: string) => void;
  deletePlan: (id: string) => void;
  addExercisesToPlan: (planId: string, exerciseIds: string[]) => void;
  removePlanExercise: (planId: string, index: number) => void;
  movePlanExercise: (planId: string, index: number, dir: -1 | 1) => void;
  setPlanExercises: (planId: string, exercises: Plan['exercises']) => void;
  setPlanRest: (planId: string, index: number, restSeconds: number) => void;
  addPlanSet: (planId: string, index: number) => void;
  removePlanSet: (planId: string, index: number, setIndex: number) => void;
  updatePlanSet: (planId: string, index: number, setIndex: number, patch: Partial<SetTarget>) => void;

  startWorkout: (planId?: string) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  addExercisesToActive: (exerciseIds: string[]) => void;
  removeActiveExercise: (index: number) => void;
  toggleMachineVariant: (index: number) => void;
  addActiveSet: (index: number) => void;
  removeActiveSet: (index: number) => void;
  updateActiveSet: (index: number, setIndex: number, patch: Partial<SetLog>) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;

  deleteWorkout: (id: string) => void;

  addMeal: (meal: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, patch: Partial<Omit<Meal, 'id'>>) => void;
  deleteMeal: (id: string) => void;
  setMacroGoals: (goals: MacroGoals) => void;

  addWater: (ml: number) => void;
  undoWater: () => void;
  setWaterGoal: (ml: number) => void;

  setUnit: (unit: 'kg' | 'lb') => void;
  setBarWeight: (w: number) => void;
  setApiKey: (which: 'exercisedb' | 'gemini', value: string) => void;
  setScheduleDay: (day: number, value: string | null) => void;
  setScheduleMode: (mode: 'weekly' | 'cycle') => void;
  setCycle: (cycle: string[]) => void;
  restartCycleToday: () => void;
  setHomeEquipment: (equipment: keyof AppState['homeEquipment'], value: boolean) => void;
  setReminders: (enabled: boolean, hour: number) => void;
  setAccent: (accent: AccentId) => void;
  setBgTheme: (bgTheme: BgId) => void;
  setFontScale: (fontScale: FontScaleId) => void;
  setUiFlavor: (uiFlavor: UiFlavor) => void;
  setPageAnimations: (on: boolean) => void;
  setGreeting: (greeting: string) => void;
  toggleFavoriteMeal: (id: string) => void;
  togglePlanSuperset: (planId: string, index: number) => void;
  addMeasurement: (metric: MetricId, value: number) => void;
  deleteMeasurement: (id: string) => void;
  addProgressPhoto: (uri: string) => void;
  deleteProgressPhoto: (id: string) => void;
  /** swap an active exercise for the next variation hitting the same primary muscle */
  cycleVariant: (index: number) => void;
  /** swap an active exercise for an easier regression (e.g. push-up → knee push-up) */
  easyVariant: (index: number) => void;
  /** dev helper: inject fake workouts into history for testing */
  seedDemoData: () => void;

  /** replace all data from a backup file */
  importAll: (data: Record<string, unknown>) => void;

  /** wipe everything back to a fresh install */
  resetAll: () => void;
}

function mutPlan(plans: Plan[], id: string, fn: (p: Plan) => Plan): Plan[] {
  return plans.map((p) => (p.id === id ? fn(p) : p));
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: { onboarded: false, location: 'gym' },
      plans: [],
      workouts: [],
      active: null,
      meals: [],
      macroGoals: DEFAULT_GOALS,
      waterLog: [],
      waterGoal: 2500,
      measurements: [],
      progressPhotos: [],
      unit: 'kg',
      barWeight: 20,
      apiKeys: { exercisedb: '', gemini: '' },
      homeEquipment: { barbell: false, dumbbell: false, 'pull-up bar': false },
      schedule: [null, null, null, null, null, null, null],
      scheduleMode: 'weekly',
      cycle: [],
      cycleStart: 0,
      remindersEnabled: false,
      reminderHour: 18,
      accent: 'crimson',
      bgTheme: 'dark',
      fontScale: 'default',
      uiFlavor: 'modern',
      pageAnimations: true,
      greeting: 'ARISE, HUNTER',

      setGoal: (goal, location) =>
        set((s) => ({
          profile: { ...s.profile, goal, location, onboarded: true },
          // replace previously generated plans, keep user-made ones
          plans: [...s.plans.filter((p) => !p.fromGoal), ...generatePlans(goal)],
        })),

      setLocation: (location) => set((s) => ({ profile: { ...s.profile, location } })),

      finishOnboarding: () => set((s) => ({ profile: { ...s.profile, onboarded: true } })),

      createPlan: (name) => {
        const id = uid();
        set((s) => ({
          plans: [...s.plans, { id, name, exercises: [], createdAt: Date.now() }],
        }));
        return id;
      },

      renamePlan: (id, name) =>
        set((s) => ({ plans: mutPlan(s.plans, id, (p) => ({ ...p, name })) })),

      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      addExercisesToPlan: (planId, exerciseIds) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: [
              ...p.exercises,
              ...exerciseIds.map((exerciseId) => ({
                exerciseId,
                key: uid(),
                restSeconds: 90,
                sets: [
                  { reps: 10, weight: 0 },
                  { reps: 10, weight: 0 },
                  { reps: 10, weight: 0 },
                ],
              })),
            ],
          })),
        })),

      removePlanExercise: (planId, index) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.filter((_, i) => i !== index),
          })),
        })),

      setPlanExercises: (planId, exercises) =>
        set((s) => ({ plans: mutPlan(s.plans, planId, (p) => ({ ...p, exercises })) })),

      movePlanExercise: (planId, index, dir) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => {
            const to = index + dir;
            if (to < 0 || to >= p.exercises.length) return p;
            const exercises = [...p.exercises];
            [exercises[index], exercises[to]] = [exercises[to], exercises[index]];
            return { ...p, exercises };
          }),
        })),

      setPlanRest: (planId, index, restSeconds) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.map((e, i) => (i === index ? { ...e, restSeconds } : e)),
          })),
        })),

      addPlanSet: (planId, index) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.map((e, i) =>
              i === index
                ? { ...e, sets: [...e.sets, e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0 }] }
                : e
            ),
          })),
        })),

      removePlanSet: (planId, index, setIndex) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.map((e, i) =>
              i === index ? { ...e, sets: e.sets.filter((_, si) => si !== setIndex) } : e
            ),
          })),
        })),

      updatePlanSet: (planId, index, setIndex, patch) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.map((e, i) =>
              i === index
                ? { ...e, sets: e.sets.map((st, si) => (si === setIndex ? { ...st, ...patch } : st)) }
                : e
            ),
          })),
        })),

      startWorkout: (planId) => {
        const { plans, profile, workouts } = get();
        const plan = planId ? plans.find((p) => p.id === planId) : undefined;
        const exercises: WorkoutExercise[] = (plan?.exercises ?? []).map((e) => {
          const exerciseId = resolveExerciseId(e.exerciseId, profile.location);
          const swapped = exerciseId !== e.exerciseId;
          const eq = getExercise(exerciseId).equipment;
          // a swapped-in bodyweight move shouldn't inherit the barbell's kg
          const zeroWeight = swapped && (eq === 'bodyweight' || eq === 'pull-up bar');

          // prefer last session's actual performance over the plan's static defaults
          const prev = lastPerformance(workouts, exerciseId);
          const baseSets = prev
            ? prev.map((s) => ({ reps: s.reps, weight: zeroWeight ? 0 : s.weight, done: false }))
            : e.sets.map((st) => ({ ...st, weight: zeroWeight ? 0 : st.weight, done: false }));

          return {
            exerciseId,
            restSeconds: e.restSeconds,
            supersetWithNext: e.supersetWithNext,
            sets: baseSets,
          };
        });
        set({
          active: {
            planId,
            name: plan?.name ?? 'Quick Workout',
            startedAt: Date.now(),
            location: profile.location,
            activeMs: 0,
            lastResumedAt: Date.now(),
            exercises,
          },
        });
      },

      pauseWorkout: () =>
        set((s) => {
          if (!s.active || s.active.lastResumedAt == null) return s;
          return {
            active: {
              ...s.active,
              activeMs: (s.active.activeMs ?? 0) + (Date.now() - s.active.lastResumedAt),
              lastResumedAt: null,
            },
          };
        }),

      resumeWorkout: () =>
        set((s) =>
          s.active && s.active.lastResumedAt == null
            ? { active: { ...s.active, lastResumedAt: Date.now() } }
            : s
        ),

      addExercisesToActive: (exerciseIds) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: [
                    ...s.active.exercises,
                    ...exerciseIds.map((exerciseId) => {
                      const prev = lastPerformance(s.workouts, exerciseId);
                      const eq = getExercise(exerciseId).equipment;
                      const zero = eq === 'bodyweight' || eq === 'pull-up bar';
                      const sets = prev
                        ? prev.map((st) => ({ reps: st.reps, weight: zero ? 0 : st.weight, done: false }))
                        : [
                            { reps: 10, weight: 0, done: false },
                            { reps: 10, weight: 0, done: false },
                            { reps: 10, weight: 0, done: false },
                          ];
                      return { exerciseId, restSeconds: 90, sets };
                    }),
                  ],
                },
              }
            : s
        ),

      removeActiveExercise: (index) =>
        set((s) =>
          s.active
            ? { active: { ...s.active, exercises: s.active.exercises.filter((_, i) => i !== index) } }
            : s
        ),

      toggleMachineVariant: (index) =>
        set((s) => {
          if (!s.active) return s;
          return {
            active: {
              ...s.active,
              exercises: s.active.exercises.map((e, i) => {
                if (i !== index) return e;
                const nextId = e.swappedFrom || MACHINE_SWAP[e.exerciseId];
                if (!nextId) return e;
                const eq = getExercise(nextId).equipment;
                const zero = eq === 'bodyweight' || eq === 'pull-up bar';

                // Look up PR
                const prev = lastPerformance(s.workouts, nextId);
                const sets = prev
                  ? prev.map((st) => ({ reps: st.reps, weight: zero ? 0 : st.weight, done: false }))
                  : Array.from({ length: e.sets.length }, () => ({
                      reps: 10,
                      weight: zero ? 0 : (eq === 'barbell' ? 20 : (eq === 'dumbbell' ? 10 : 0)),
                      done: false,
                    }));

                return {
                  ...e,
                  exerciseId: nextId,
                  swappedFrom: e.swappedFrom ? undefined : e.exerciseId,
                  initialExerciseId: undefined,
                  sets,
                };
              }),
            },
          };
        }),

      addActiveSet: (index) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: s.active.exercises.map((e, i) =>
                    i === index
                      ? {
                          ...e,
                          sets: [
                            ...e.sets,
                            { ...(e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0 }), done: false },
                          ],
                        }
                      : e
                  ),
                },
              }
            : s
        ),

      removeActiveSet: (index) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: s.active.exercises.map((e, i) =>
                    i === index && e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e
                  ),
                },
              }
            : s
        ),

      updateActiveSet: (index, setIndex, patch) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: s.active.exercises.map((e, i) =>
                    i === index
                      ? {
                          ...e,
                          sets: e.sets.map((st, si) => (si === setIndex ? { ...st, ...patch } : st)),
                        }
                      : e
                  ),
                },
              }
            : s
        ),

      finishWorkout: () => {
        const a = get().active;
        if (!a) return;
        const now = Date.now();
        // fallback for workouts started before pause tracking existed
        const running = a.lastResumedAt != null ? now - a.lastResumedAt : 0;
        const durationMs =
          a.activeMs != null || a.lastResumedAt !== undefined
            ? (a.activeMs ?? 0) + running
            : now - a.startedAt;
        const workout: Workout = {
          id: uid(),
          planId: a.planId,
          name: a.name,
          startedAt: a.startedAt,
          finishedAt: now,
          durationMs,
          location: a.location,
          exercises: a.exercises,
        };
        set((s) => {
          // sync completed set values back into the source plan so next session
          // pre-fills with what was actually lifted
          let updatedPlans = s.plans;
          if (a.planId) {
            updatedPlans = mutPlan(s.plans, a.planId, (plan) => ({
              ...plan,
              exercises: plan.exercises.map((pe) => {
                // find the matching active exercise (by exerciseId)
                const done = a.exercises.find(
                  (we) => we.exerciseId === pe.exerciseId && we.sets.some((st) => st.done)
                );
                if (!done) return pe; // not performed — keep plan as-is
                const doneSets = done.sets.filter((st) => st.done);
                return {
                  ...pe,
                  sets: doneSets.map((st) => ({
                    reps: st.reps,
                    weight: st.weight,
                  })),
                };
              }),
            }));
          }
          return { workouts: [workout, ...s.workouts], active: null, plans: updatedPlans };
        });
      },

      cancelWorkout: () => set({ active: null }),

      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      addMeal: (meal) => set((s) => ({ meals: [{ ...meal, id: uid() }, ...s.meals] })),

      updateMeal: (id, patch) =>
        set((s) => ({ meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      deleteMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      setMacroGoals: (macroGoals) => set({ macroGoals }),

      addWater: (ml) =>
        set((s) => ({ waterLog: [...s.waterLog, { time: Date.now(), ml }] })),

      undoWater: () => set((s) => ({ waterLog: s.waterLog.slice(0, -1) })),

      setWaterGoal: (waterGoal) => set({ waterGoal: Math.max(0, Math.round(waterGoal)) }),

      setUnit: (unit) => set({ unit, barWeight: unit === 'kg' ? 20 : 45 }),

      setBarWeight: (barWeight) => set({ barWeight: Math.max(0, barWeight) }),

      setApiKey: (which, value) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [which]: value.trim() } })),

      setScheduleDay: (day, value) =>
        set((s) => ({ schedule: s.schedule.map((v, i) => (i === day ? value : v)) })),

      setScheduleMode: (scheduleMode) =>
        set((s) => ({
          scheduleMode,
          cycleStart: s.cycleStart || Date.now(),
        })),

      setCycle: (cycle) => set((s) => ({ cycle, cycleStart: s.cycleStart || Date.now() })),

      restartCycleToday: () => set({ cycleStart: Date.now() }),

      setHomeEquipment: (equipment, value) =>
        set((s) => ({ homeEquipment: { ...s.homeEquipment, [equipment]: value } })),

      setReminders: (remindersEnabled, reminderHour) =>
        set({ remindersEnabled, reminderHour: Math.min(23, Math.max(0, Math.round(reminderHour))) }),

      setAccent: (accent) => set({ accent }),

      setBgTheme: (bgTheme) => set({ bgTheme }),

      setFontScale: (fontScale) => set({ fontScale }),

      setUiFlavor: (uiFlavor) => set({ uiFlavor }),

      setPageAnimations: (pageAnimations) => set({ pageAnimations }),

      toggleFavoriteMeal: (id) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m)),
        })),

      togglePlanSuperset: (planId, index) =>
        set((s) => ({
          plans: mutPlan(s.plans, planId, (p) => ({
            ...p,
            exercises: p.exercises.map((e, i) =>
              i === index ? { ...e, supersetWithNext: !e.supersetWithNext } : e
            ),
          })),
        })),

      addMeasurement: (metric, value) =>
        set((s) => ({
          measurements: [{ id: uid(), time: Date.now(), metric, value }, ...s.measurements],
        })),

      deleteMeasurement: (id) =>
        set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),

      addProgressPhoto: (uri) =>
        set((s) => ({
          progressPhotos: [{ id: uid(), time: Date.now(), uri }, ...s.progressPhotos],
        })),

      deleteProgressPhoto: (id) =>
        set((s) => ({ progressPhotos: s.progressPhotos.filter((p) => p.id !== id) })),

      setGreeting: (greeting) => set({ greeting: greeting.trim() || 'ARISE, HUNTER' }),

      cycleVariant: (index) =>
        set((s) => {
          if (!s.active) return s;
          return {
            active: {
              ...s.active,
              exercises: s.active.exercises.map((e, i) => {
                if (i !== index) return e;
                const cur = getExercise(e.exerciseId);
                const home = s.active!.location === 'home';
                // variations: same primary muscle (or any cardio for cardio), matching location
                const pool = EXERCISES.filter(
                  (x) =>
                    (cur.cardio ? x.cardio : !x.cardio && x.muscles[0] === cur.muscles[0]) &&
                    (!home || x.home)
                ).sort((a, b) => a.name.localeCompare(b.name));
                if (pool.length < 2) return e;
                const at = pool.findIndex((x) => x.id === e.exerciseId);
                const next = pool[(at + 1) % pool.length];
                const eq = next.equipment;
                const zero = eq === 'bodyweight' || eq === 'pull-up bar';

                // Look up PR
                const prev = lastPerformance(s.workouts, next.id);
                const sets = prev
                  ? prev.map((st) => ({ reps: st.reps, weight: zero ? 0 : st.weight, done: false }))
                  : Array.from({ length: e.sets.length }, () => ({
                      reps: 10,
                      weight: zero ? 0 : (eq === 'barbell' ? 20 : (eq === 'dumbbell' ? 10 : 0)),
                      done: false,
                    }));

                return {
                  ...e,
                  exerciseId: next.id,
                  swappedFrom: undefined,
                  initialExerciseId: undefined,
                  sets,
                };
              }),
            },
          };
        }),

      easyVariant: (index) =>
        set((s) => {
          if (!s.active) return s;
          return {
            active: {
              ...s.active,
              exercises: s.active.exercises.map((e, i) => {
                if (i !== index) return e;
                const initialId = e.initialExerciseId || e.exerciseId;
                let nextId = EASY_VARIATION[e.exerciseId];
                if (!nextId) {
                  // Loop back to the original starting exercise
                  nextId = initialId;
                }
                if (!nextId || nextId === e.exerciseId) return e;
                const next = EXERCISES.find((x) => x.id === nextId);
                if (!next) return e;
                const eq = next.equipment;
                const zero = eq === 'bodyweight' || eq === 'pull-up bar';

                // Look up PR
                const prev = lastPerformance(s.workouts, next.id);
                const sets = prev
                  ? prev.map((st) => ({ reps: st.reps, weight: zero ? 0 : st.weight, done: false }))
                  : Array.from({ length: e.sets.length }, () => ({
                      reps: 10,
                      weight: zero ? 0 : (eq === 'barbell' ? 20 : (eq === 'dumbbell' ? 10 : 0)),
                      done: false,
                    }));

                return {
                  ...e,
                  exerciseId: next.id,
                  initialExerciseId: initialId,
                  swappedFrom: undefined,
                  sets,
                };
              }),
            },
          };
        }),


      seedDemoData: () => {
        const DAY = 24 * 3600 * 1000;
        const now = Date.now();
        const rnd = (min: number, max: number) => min + Math.random() * (max - min);
        const TEMPLATES: [string, [string, number][]][] = [
          ['Demo Push', [['bench-press', 50], ['overhead-press', 30], ['cable-pushdown', 20]]],
          ['Demo Pull', [['deadlift', 80], ['barbell-row', 45], ['db-curl', 10]]],
          ['Demo Legs', [['squat', 60], ['romanian-deadlift', 50], ['standing-calf-raise', 40]]],
          ['Demo Cardio', [['running', 0]]],
        ];
        const workouts: Workout[] = [];
        for (let daysAgo = 28; daysAgo >= 1; daysAgo--) {
          if (Math.random() < 0.35) continue; // skip ~1/3 of days
          const [name, exs] = TEMPLATES[daysAgo % TEMPLATES.length];
          const startedAt = now - daysAgo * DAY - Math.round(rnd(-3, 3) * 3600 * 1000);
          const durationMs = Math.round(rnd(35, 80) * 60 * 1000);
          const progress = (28 - daysAgo) * 0.6; // later workouts heavier → PRs appear
          workouts.push({
            id: uid(),
            name,
            startedAt,
            finishedAt: startedAt + durationMs,
            durationMs,
            location: Math.random() < 0.25 ? 'home' : 'gym',
            exercises: exs.map(([exerciseId, base]) => {
              if (getExercise(exerciseId).cardio) {
                return {
                  exerciseId,
                  restSeconds: 0,
                  sets: [{ reps: Math.round(rnd(20, 45)), weight: Math.round(rnd(3, 8)), done: true }],
                };
              }
              const weight = Math.round((base + progress + rnd(-2.5, 2.5)) / 2.5) * 2.5;
              const nSets = Math.random() < 0.5 ? 3 : 4;
              return {
                exerciseId,
                restSeconds: 90,
                sets: Array.from({ length: nSets }, () => ({
                  weight,
                  reps: Math.round(rnd(6, 12)),
                  done: Math.random() > 0.08,
                })),
              };
            }),
          });
        }
        workouts.sort((a, b) => b.finishedAt - a.finishedAt);

        // a few placeholder meals so recents/quick-add and goals can be tested
        const DEMO_MEALS: [string, number, number, number, number][] = [
          ['Chicken rice', 620, 38, 78, 16],
          ['Protein shake + banana', 320, 32, 40, 4],
          ['Salmon, potatoes & greens', 540, 42, 45, 20],
          ['Oats with peanut butter', 450, 18, 55, 18],
          ['Beef burrito', 780, 35, 82, 32],
        ];
        const meals: Meal[] = DEMO_MEALS.map(([desc, kcal, protein, carbs, fat], i) => ({
          id: uid(),
          time: now - Math.floor(i / 2) * DAY - (10 + (i % 2) * 7) * 3600 * 1000,
          desc,
          kcal,
          protein,
          carbs,
          fat,
        }));

        set((s) => ({ workouts: [...workouts, ...s.workouts], meals: [...meals, ...s.meals] }));
      },

      importAll: (data) =>
        set((s) => ({
          profile: (data.profile as Profile) ?? s.profile,
          plans: Array.isArray(data.plans) ? (data.plans as Plan[]) : s.plans,
          workouts: Array.isArray(data.workouts) ? (data.workouts as Workout[]) : s.workouts,
          // backup.ts restores embedded photos to local files before calling this
          meals: Array.isArray(data.meals) ? (data.meals as Meal[]) : s.meals,
          progressPhotos: Array.isArray(data.progressPhotos)
            ? (data.progressPhotos as ProgressPhoto[])
            : s.progressPhotos,
          macroGoals: { ...DEFAULT_GOALS, ...((data.macroGoals as MacroGoals) ?? s.macroGoals) },
          measurements: Array.isArray(data.measurements)
            ? (data.measurements as Measurement[])
            : s.measurements,
          waterLog: Array.isArray(data.waterLog) ? (data.waterLog as AppState['waterLog']) : s.waterLog,
          waterGoal: typeof data.waterGoal === 'number' ? data.waterGoal : s.waterGoal,
          unit: data.unit === 'lb' ? 'lb' : 'kg',
          barWeight: typeof data.barWeight === 'number' ? data.barWeight : s.barWeight,
          schedule: Array.isArray(data.schedule) ? (data.schedule as (string | null)[]) : s.schedule,
          active: null,
        })),

      resetAll: () =>
        set({
          profile: { onboarded: false, location: 'gym' },
          plans: [],
          workouts: [],
          active: null,
          meals: [],
          macroGoals: DEFAULT_GOALS,
          waterLog: [],
          waterGoal: 2500,
          measurements: [],
          progressPhotos: [],
          uiFlavor: 'modern',
          pageAnimations: true,
          unit: 'kg',
          barWeight: 20,
          apiKeys: { exercisedb: '', gemini: '' },
          homeEquipment: { barbell: false, dumbbell: false, 'pull-up bar': false, bench: false, band: false, 'medicine ball': false },
          schedule: [null, null, null, null, null, null, null],
          scheduleMode: 'weekly',
          cycle: [],
          cycleStart: 0,
          remindersEnabled: false,
          reminderHour: 18,
          accent: 'crimson',
          bgTheme: 'dark',
          fontScale: 'default',
          greeting: 'ARISE, HUNTER',
        }),
    }),
    {
      name: 'mort-hevy-v1',
      // AsyncStorage on web backs onto window.localStorage, which doesn't exist
      // when Expo server-renders in Node — fall back to a no-op store there.
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? {
              getItem: async () => null,
              setItem: async () => {},
              removeItem: async () => {},
            }
          : AsyncStorage
      ),
      partialize: (s) => ({
        profile: s.profile,
        plans: s.plans,
        workouts: s.workouts,
        active: s.active,
        meals: s.meals,
        macroGoals: s.macroGoals,
        waterLog: s.waterLog,
        waterGoal: s.waterGoal,
        measurements: s.measurements,
        progressPhotos: s.progressPhotos,
        uiFlavor: s.uiFlavor,
        pageAnimations: s.pageAnimations,
        unit: s.unit,
        barWeight: s.barWeight,
        apiKeys: s.apiKeys,
        homeEquipment: s.homeEquipment,
        schedule: s.schedule,
        scheduleMode: s.scheduleMode,
        cycle: s.cycle,
        cycleStart: s.cycleStart,
        remindersEnabled: s.remindersEnabled,
        reminderHour: s.reminderHour,
        accent: s.accent,
        bgTheme: s.bgTheme,
        fontScale: s.fontScale,
        greeting: s.greeting,
      }),
      onRehydrateStorage: () => () => {
        useApp.setState((s) => ({
          hydrated: true,
          // backfill drag-reorder keys on plans saved before keys existed
          plans: s.plans.map((p) => ({
            ...p,
            exercises: p.exercises.map((e) => (e.key ? e : { ...e, key: uid() })),
          })),
          // older saves predate sodium
          macroGoals: { ...DEFAULT_GOALS, ...s.macroGoals },
          // 'y2k' flavor was renamed to 'boxy'
          uiFlavor: (s.uiFlavor as string) === 'y2k' ? 'boxy' : s.uiFlavor,
        }));
      },
    }
  )
);

/** Most recent logged sets for an exercise, e.g. "60kg x 8" — shown as "last time". */
export function lastPerformance(workouts: Workout[], exerciseId: string): SetLog[] | null {
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done));
    if (ex) return ex.sets.filter((s) => s.done);
  }
  return null;
}

export function workoutVolume(exercises: WorkoutExercise[]): number {
  let v = 0;
  for (const e of exercises) {
    // cardio sets encode km/minutes, not weight×reps — they are not lifting volume
    if (getExercise(e.exerciseId).cardio) continue;
    for (const s of e.sets) if (s.done) v += s.reps * s.weight;
  }
  return v;
}

export function doneSets(exercises: WorkoutExercise[]): number {
  let n = 0;
  for (const e of exercises) for (const s of e.sets) if (s.done) n++;
  return n;
}
