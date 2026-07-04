import { getExercise } from './exercises';
import type { Plan, PhysiqueGoalId } from './types';

export interface PhysiqueGoal {
  id: PhysiqueGoalId;
  title: string;
  tagline: string;
  description: string;
  cardio: string;
  daysPerWeek: string;
}

export const PHYSIQUE_GOALS: PhysiqueGoal[] = [
  {
    id: 'lean-athletic',
    title: 'Lean & Athletic',
    tagline: 'The Sung Jin-Woo look — sharp, defined, capable.',
    description:
      'Hypertrophy training with an upper/lower split plus conditioning. Enough cardio to stay lean, not so much it eats your muscle.',
    cardio: 'Moderate — 2 sessions/week',
    daysPerWeek: '4 lifting + 2 cardio',
  },
  {
    id: 'muscular',
    title: 'Muscular & Big',
    tagline: 'Maximum size. Fill the doorframe.',
    description:
      'Push/Pull/Legs split focused on volume and progressive overload. Cardio kept minimal so recovery goes into growth.',
    cardio: 'Low — 1 optional light session',
    daysPerWeek: '3–6 lifting',
  },
  {
    id: 'strength',
    title: 'Strong & Solid',
    tagline: 'Numbers on the bar. Dense, powerful build.',
    description:
      'Full-body sessions built around heavy compound lifts at 5x5. Simple, brutal, effective.',
    cardio: 'Low — walking on rest days',
    daysPerWeek: '3 lifting',
  },
  {
    id: 'hybrid',
    title: 'Hybrid Athlete',
    tagline: 'Run far, lift heavy. Do both.',
    description:
      'Balanced strength + endurance: 2 full-body lifting days and 3 structured runs/rides per week.',
    cardio: 'High — 3 sessions/week',
    daysPerWeek: '2 lifting + 3 cardio',
  },
  {
    id: 'fat-loss',
    title: 'Cut & Conditioned',
    tagline: 'Burn it down. Keep the muscle underneath.',
    description:
      'Full-body circuits to hold on to muscle while calories are low, plus frequent easy cardio for extra burn.',
    cardio: 'High — 3 easy sessions/week',
    daysPerWeek: '3 circuits + 3 cardio',
  },
];

export function getGoal(id: PhysiqueGoalId): PhysiqueGoal {
  return PHYSIQUE_GOALS.find((g) => g.id === id) ?? PHYSIQUE_GOALS[0];
}

/** [exerciseId, sets, reps, restSeconds] — cardio rows use [id, 1, minutes, km] */
type Row = [string, number, number, number];

interface Template {
  name: string;
  note?: string;
  rows: Row[];
}

const TEMPLATES: Record<PhysiqueGoalId, Template[]> = {
  'lean-athletic': [
    {
      name: 'Upper A',
      note:
        'Run Upper A/B + Lower A/B once each per week (4 lifting days). Research: split type doesn’t matter when volume is equal — what matters is 10–20 sets per muscle weekly, each muscle hit ~2×/week. This split lands every major muscle in that window. Leave 1–2 reps in the tank on most sets.',
      rows: [
        ['bench-press', 4, 8, 120],
        ['barbell-row', 4, 8, 120],
        ['overhead-press', 3, 10, 90],
        ['lat-pulldown', 3, 10, 90],
        ['lateral-raise', 3, 12, 60],
        ['hammer-curl', 3, 12, 60],
        ['cable-pushdown', 3, 12, 60],
      ],
    },
    {
      name: 'Lower A',
      note: 'Quads-led day. With Lower B this puts quads/hams/glutes at ~12-16 weekly sets.',
      rows: [
        ['squat', 4, 8, 150],
        ['romanian-deadlift', 3, 10, 120],
        ['walking-lunge', 3, 12, 90],
        ['standing-calf-raise', 4, 12, 60],
        ['hanging-leg-raise', 3, 10, 60],
        ['plank', 3, 45, 60],
      ],
    },
    {
      name: 'Upper B',
      note: 'Volume day — higher reps, shorter rests than Upper A. Push sets close to failure.',
      rows: [
        ['incline-db-press', 4, 10, 120],
        ['pull-up', 4, 8, 120],
        ['db-shoulder-press', 3, 10, 90],
        ['seated-cable-row', 3, 10, 90],
        ['cable-fly', 2, 15, 60],
        ['face-pull', 3, 15, 60],
        ['db-curl', 3, 12, 60],
        ['skullcrusher', 3, 12, 60],
      ],
    },
    {
      name: 'Lower B',
      note: 'Hinge-led day: deadlift heavy, then quads/hams accessories.',
      rows: [
        ['deadlift', 3, 6, 180],
        ['leg-press', 3, 12, 120],
        ['bulgarian-split-squat', 3, 10, 90],
        ['leg-curl', 3, 12, 90],
        ['seated-calf-raise', 4, 15, 60],
        ['ab-wheel', 3, 10, 60],
      ],
    },
    {
      name: 'Conditioning — Easy Run',
      note:
        'Zone 2, conversational pace. 1-2 easy sessions/week improves recovery and keeps you lean without eating muscle — keep hard cardio away from leg days.',
      rows: [['running', 1, 30, 5]],
    },
    {
      name: 'Conditioning — Intervals',
      note: '8 rounds: 30s hard / 90s easy. Short, sharp, done. Slot it after an upper day, never before legs.',
      rows: [
        ['interval-sprints', 1, 16, 3],
        ['jump-rope', 1, 5, 0],
      ],
    },
  ],
  muscular: [
    {
      name: 'Push Day',
      note:
        'Best run as PPL ×2 (6 days) so each muscle gets hit twice weekly — a 2016 meta-analysis found ~2×/week frequency beats 1× for growth at equal volume. On 3 days/week, add a set to each exercise to keep weekly volume in the 10-20 sets/muscle window.',
      rows: [
        ['bench-press', 4, 8, 150],
        ['overhead-press', 3, 8, 120],
        ['incline-db-press', 3, 10, 90],
        ['lateral-raise', 4, 12, 60],
        ['cable-pushdown', 3, 12, 60],
        ['overhead-triceps-ext', 3, 12, 60],
      ],
    },
    {
      name: 'Pull Day',
      rows: [
        ['deadlift', 3, 5, 180],
        ['barbell-row', 4, 8, 120],
        ['lat-pulldown', 3, 10, 90],
        ['face-pull', 3, 15, 60],
        ['barbell-curl', 3, 10, 60],
        ['hammer-curl', 3, 12, 60],
      ],
    },
    {
      name: 'Leg Day',
      rows: [
        ['squat', 4, 8, 180],
        ['romanian-deadlift', 3, 8, 120],
        ['leg-press', 3, 12, 120],
        ['leg-curl', 3, 12, 90],
        ['standing-calf-raise', 4, 12, 60],
        ['cable-crunch', 3, 12, 60],
      ],
    },
    {
      name: 'Optional Light Cardio',
      note: 'Keeps the heart alive during the bulk. Do not turn this into a run.',
      rows: [['incline-walk', 1, 20, 2]],
    },
  ],
  strength: [
    {
      name: 'Full Body A',
      note:
        'Alternate A/B/A, B/A/B weekly (3 days). Add 2.5 kg when you complete all sets — linear progression is the fastest strength driver for the first year.',
      rows: [
        ['squat', 5, 5, 180],
        ['bench-press', 5, 5, 180],
        ['barbell-row', 5, 5, 180],
        ['plank', 3, 45, 60],
      ],
    },
    {
      name: 'Full Body B',
      rows: [
        ['deadlift', 3, 5, 240],
        ['overhead-press', 5, 5, 180],
        ['pull-up', 3, 8, 120],
        ['farmer-carry', 3, 40, 90],
      ],
    },
    {
      name: 'Recovery Walk',
      note: 'Easy pace on rest days. Recovery is where strength is built.',
      rows: [['incline-walk', 1, 30, 3]],
    },
  ],
  hybrid: [
    {
      name: 'Full Body Strength A',
      rows: [
        ['squat', 4, 6, 150],
        ['bench-press', 4, 6, 150],
        ['barbell-row', 3, 8, 120],
        ['plank', 3, 45, 60],
      ],
    },
    {
      name: 'Full Body Strength B',
      rows: [
        ['deadlift', 3, 5, 180],
        ['db-shoulder-press', 3, 8, 90],
        ['pull-up', 3, 8, 120],
        ['hanging-leg-raise', 3, 10, 60],
      ],
    },
    {
      name: 'Easy Run',
      note: 'Zone 2 — you should be able to hold a conversation.',
      rows: [['running', 1, 35, 5]],
    },
    {
      name: 'Interval Run',
      note: '6 x 2min hard / 2min easy.',
      rows: [['interval-sprints', 1, 24, 4]],
    },
    {
      name: 'Long Run / Ride',
      note: 'The weekly long one. Slow. Swap in cycling whenever you like.',
      rows: [['running', 1, 60, 9]],
    },
  ],
  'fat-loss': [
    {
      name: 'Circuit A',
      note: 'Minimal rest between exercises, 90s between rounds.',
      rows: [
        ['goblet-squat', 3, 12, 30],
        ['push-up', 3, 12, 30],
        ['inverted-row', 3, 10, 30],
        ['kettlebell-swing', 3, 15, 30],
        ['plank', 3, 40, 90],
      ],
    },
    {
      name: 'Circuit B',
      note: 'Minimal rest between exercises, 90s between rounds.',
      rows: [
        ['walking-lunge', 3, 12, 30],
        ['db-shoulder-press', 3, 10, 30],
        ['db-row', 3, 12, 30],
        ['burpee', 3, 10, 30],
        ['bicycle-crunch', 3, 20, 90],
      ],
    },
    {
      name: 'Circuit C',
      note: 'Minimal rest between exercises, 90s between rounds.',
      rows: [
        ['step-up', 3, 12, 30],
        ['decline-push-up', 3, 10, 30],
        ['pull-up', 3, 6, 30],
        ['jump-squat', 3, 12, 30],
        ['mountain-climber', 3, 30, 90],
      ],
    },
    {
      name: 'Easy Cardio',
      note: 'Walk, cycle or jog. Easy effort — consistency beats intensity here.',
      rows: [['incline-walk', 1, 40, 4]],
    },
  ],
};

let seq = 0;
export function uid(): string {
  seq = (seq + 1) % 1000;
  return Date.now().toString(36) + seq.toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Placeholder starting weight for the testing phase — random but plausible per equipment. */
export function testWeight(exerciseId: string): number {
  const rand = (min: number, max: number) =>
    Math.round((min + Math.random() * (max - min)) / 2.5) * 2.5;
  switch (getExercise(exerciseId).equipment) {
    case 'barbell':
      return rand(30, 70);
    case 'dumbbell':
      return rand(6, 22);
    case 'machine':
    case 'cable':
      return rand(25, 60);
    case 'kettlebell':
      return rand(12, 24);
    default:
      return 0; // bodyweight / pull-up bar / cardio
  }
}

/** Plans are generated with canonical (gym) exercises; home mode swaps them live at display/start time. */
export function generatePlans(goal: PhysiqueGoalId): Plan[] {
  const now = Date.now();
  return TEMPLATES[goal].map((t, i) => ({
    id: uid(),
    name: t.name,
    note: t.note,
    fromGoal: true,
    createdAt: now + i,
    exercises: t.rows.map(([exerciseId, sets, reps, rest]) => {
      if (getExercise(exerciseId).cardio) {
        // cardio rows encode [_, 1, minutes, km-in-rest-slot]
        return {
          exerciseId,
          key: uid(),
          restSeconds: 0,
          sets: [{ reps, weight: rest }],
        };
      }
      const weight = testWeight(exerciseId);
      return {
        exerciseId,
        key: uid(),
        restSeconds: rest,
        sets: Array.from({ length: sets }, () => ({ reps, weight })),
      };
    }),
  }));
}
