export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full body'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'pull-up bar'
  | 'cardio'
  | 'bench'
  | 'band'
  | 'medicine ball';

export interface Exercise {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment;
  /** doable with bodyweight, dumbbells or a pull-up bar */
  home: boolean;
  /** duration/distance based instead of reps x weight */
  cardio?: boolean;
}

/** For strength: reps x weight(kg). For cardio: reps = minutes, weight = km. */
export interface SetTarget {
  reps: number;
  weight: number;
}

export interface SetLog extends SetTarget {
  done: boolean;
}

export interface PlanExercise {
  exerciseId: string;
  /** stable identity for drag-reorder (missing on old data; backfilled on load) */
  key?: string;
  /** linked to the following exercise as a superset */
  supersetWithNext?: boolean;
  sets: SetTarget[];
  restSeconds: number;
}

export interface Plan {
  id: string;
  name: string;
  note?: string;
  exercises: PlanExercise[];
  createdAt: number;
  /** generated from a physique goal (replaced when goal changes) */
  fromGoal?: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  restSeconds: number;
  /** set when the user switched to a machine variant mid-workout — holds the original id */
  swappedFrom?: string;
  /** holds the original starting exercise ID before regression/easy variants were applied */
  initialExerciseId?: string;
  /** superset-linked to the following exercise (rest starts after the partner) */
  supersetWithNext?: boolean;
  sets: SetLog[];
}

export interface Workout {
  id: string;
  planId?: string;
  name: string;
  startedAt: number;
  finishedAt: number;
  /** actual training time, excluding paused stretches (optional: older logs predate this) */
  durationMs?: number;
  /** which variation was used (optional: older logs predate this) */
  location?: TrainLocation;
  exercises: WorkoutExercise[];
}

export interface ActiveWorkout {
  planId?: string;
  name: string;
  startedAt: number;
  location?: TrainLocation;
  /** training time accumulated before the last pause */
  activeMs?: number;
  /** when the current running stretch began; null = paused */
  lastResumedAt?: number | null;
  exercises: WorkoutExercise[];
}

export interface MealItem {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  source?: string;
  sourceUrl?: string;
}

export interface Meal {
  id: string;
  /** ms timestamp of when it was eaten/logged */
  time: number;
  desc: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** mg (optional: older logs predate sodium tracking) */
  sodium?: number;
  /** starred for one-tap re-logging */
  favorite?: boolean;
  /** per-item AI breakdown, when the meal was analyzed */
  items?: MealItem[];
  /** local copy of the food photo, when one was taken */
  photoUri?: string;
}

export interface MacroGoals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** mg */
  sodium: number;
}

export type MetricId = 'weight' | 'waist' | 'chest' | 'arm' | 'thigh' | 'hips';

export interface Measurement {
  id: string;
  time: number;
  metric: MetricId;
  value: number;
}

export interface ProgressPhoto {
  id: string;
  time: number;
  uri: string;
}

export type PhysiqueGoalId =
  | 'lean-athletic'
  | 'muscular'
  | 'strength'
  | 'hybrid'
  | 'fat-loss';

export type TrainLocation = 'gym' | 'home';

export interface Profile {
  onboarded: boolean;
  goal?: PhysiqueGoalId;
  location: TrainLocation;
}
