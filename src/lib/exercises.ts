import type { Exercise, MuscleGroup, TrainLocation } from './types';

export const EXERCISES: Exercise[] = [
  // ── Chest ──────────────────────────────────────────────
  { id: 'bench-press', name: 'Bench Press', muscles: ['chest', 'triceps'], equipment: 'barbell', home: false },
  { id: 'incline-bench-press', name: 'Incline Bench Press', muscles: ['chest', 'shoulders'], equipment: 'barbell', home: false },
  { id: 'db-bench-press', name: 'Dumbbell Bench Press', muscles: ['chest', 'triceps'], equipment: 'dumbbell', home: true },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscles: ['chest', 'shoulders'], equipment: 'dumbbell', home: false },
  { id: 'db-floor-press', name: 'Dumbbell Floor Press', muscles: ['chest', 'triceps'], equipment: 'dumbbell', home: true },
  { id: 'cable-fly', name: 'Cable Fly', muscles: ['chest'], equipment: 'cable', home: false },
  { id: 'push-up', name: 'Push-Up', muscles: ['chest', 'triceps'], equipment: 'bodyweight', home: true },
  { id: 'incline-push-up', name: 'Incline Push-Up', muscles: ['chest'], equipment: 'bodyweight', home: true },
  { id: 'decline-push-up', name: 'Decline Push-Up', muscles: ['chest', 'shoulders'], equipment: 'bodyweight', home: true },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', muscles: ['triceps', 'chest'], equipment: 'bodyweight', home: true },
  { id: 'archer-push-up', name: 'Archer Push-Up', muscles: ['chest', 'triceps'], equipment: 'bodyweight', home: true },
  { id: 'chest-dip', name: 'Chest Dip', muscles: ['chest', 'triceps'], equipment: 'bodyweight', home: false },
  { id: 'chair-dip', name: 'Chair Dip', muscles: ['triceps', 'chest'], equipment: 'bodyweight', home: true },

  // ── Back ───────────────────────────────────────────────
  { id: 'deadlift', name: 'Deadlift', muscles: ['back', 'hamstrings', 'glutes'], equipment: 'barbell', home: false },
  { id: 'barbell-row', name: 'Barbell Row', muscles: ['back', 'biceps'], equipment: 'barbell', home: false },
  { id: 'db-row', name: 'Dumbbell Row', muscles: ['back', 'biceps'], equipment: 'dumbbell', home: true },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscles: ['back', 'biceps'], equipment: 'machine', home: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscles: ['back'], equipment: 'cable', home: false },
  { id: 'pull-up', name: 'Pull-Up', muscles: ['back', 'biceps'], equipment: 'pull-up bar', home: true },
  { id: 'chin-up', name: 'Chin-Up', muscles: ['back', 'biceps'], equipment: 'pull-up bar', home: true },
  { id: 'inverted-row', name: 'Inverted Row (table/bar)', muscles: ['back', 'biceps'], equipment: 'bodyweight', home: true },
  { id: 'face-pull', name: 'Face Pull', muscles: ['shoulders', 'back'], equipment: 'cable', home: false },
  { id: 'back-extension', name: 'Back Extension', muscles: ['back', 'glutes'], equipment: 'bodyweight', home: false },
  { id: 'shrug', name: 'Barbell Shrug', muscles: ['back'], equipment: 'barbell', home: false },
  { id: 'dead-hang', name: 'Dead Hang', muscles: ['back'], equipment: 'pull-up bar', home: true },

  // ── Shoulders ──────────────────────────────────────────
  { id: 'overhead-press', name: 'Overhead Press', muscles: ['shoulders', 'triceps'], equipment: 'barbell', home: false },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', muscles: ['shoulders'], equipment: 'dumbbell', home: true },
  { id: 'lateral-raise', name: 'Lateral Raise', muscles: ['shoulders'], equipment: 'dumbbell', home: true },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscles: ['shoulders'], equipment: 'dumbbell', home: true },
  { id: 'pike-push-up', name: 'Pike Push-Up', muscles: ['shoulders', 'triceps'], equipment: 'bodyweight', home: true },
  { id: 'handstand-push-up', name: 'Handstand Push-Up (wall)', muscles: ['shoulders', 'triceps'], equipment: 'bodyweight', home: true },

  // ── Arms ───────────────────────────────────────────────
  { id: 'barbell-curl', name: 'Barbell Curl', muscles: ['biceps'], equipment: 'barbell', home: false },
  { id: 'db-curl', name: 'Dumbbell Curl', muscles: ['biceps'], equipment: 'dumbbell', home: true },
  { id: 'hammer-curl', name: 'Hammer Curl', muscles: ['biceps'], equipment: 'dumbbell', home: true },
  { id: 'cable-pushdown', name: 'Cable Pushdown', muscles: ['triceps'], equipment: 'cable', home: false },
  { id: 'skullcrusher', name: 'Skullcrusher', muscles: ['triceps'], equipment: 'barbell', home: false },
  { id: 'overhead-triceps-ext', name: 'Overhead Triceps Extension', muscles: ['triceps'], equipment: 'dumbbell', home: true },
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', muscles: ['triceps', 'chest'], equipment: 'barbell', home: false },

  // ── Legs ───────────────────────────────────────────────
  { id: 'squat', name: 'Barbell Squat', muscles: ['quads', 'glutes'], equipment: 'barbell', home: false },
  { id: 'front-squat', name: 'Front Squat', muscles: ['quads', 'core'], equipment: 'barbell', home: false },
  { id: 'goblet-squat', name: 'Goblet Squat', muscles: ['quads', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'leg-press', name: 'Leg Press', muscles: ['quads', 'glutes'], equipment: 'machine', home: false },
  { id: 'leg-extension', name: 'Leg Extension', muscles: ['quads'], equipment: 'machine', home: false },
  { id: 'leg-curl', name: 'Leg Curl', muscles: ['hamstrings'], equipment: 'machine', home: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscles: ['hamstrings', 'glutes'], equipment: 'barbell', home: false },
  { id: 'db-rdl', name: 'Dumbbell Romanian Deadlift', muscles: ['hamstrings', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'single-leg-rdl', name: 'Single-Leg RDL', muscles: ['hamstrings', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscles: ['quads', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'walking-lunge', name: 'Walking Lunge', muscles: ['quads', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'step-up', name: 'Step-Up', muscles: ['quads', 'glutes'], equipment: 'dumbbell', home: true },
  { id: 'hip-thrust', name: 'Hip Thrust', muscles: ['glutes'], equipment: 'barbell', home: false },
  { id: 'glute-bridge', name: 'Glute Bridge', muscles: ['glutes'], equipment: 'bodyweight', home: true },
  { id: 'jump-squat', name: 'Jump Squat', muscles: ['quads', 'glutes'], equipment: 'bodyweight', home: true },
  { id: 'wall-sit', name: 'Wall Sit', muscles: ['quads'], equipment: 'bodyweight', home: true },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscles: ['calves'], equipment: 'machine', home: false },
  { id: 'bw-calf-raise', name: 'Calf Raise (bodyweight/DB)', muscles: ['calves'], equipment: 'bodyweight', home: true },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscles: ['calves'], equipment: 'machine', home: false },

  // ── Core ───────────────────────────────────────────────
  { id: 'plank', name: 'Plank (secs as reps)', muscles: ['core'], equipment: 'bodyweight', home: true },
  { id: 'hollow-hold', name: 'Hollow Hold (secs as reps)', muscles: ['core'], equipment: 'bodyweight', home: true },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscles: ['core'], equipment: 'pull-up bar', home: true },
  { id: 'cable-crunch', name: 'Cable Crunch', muscles: ['core'], equipment: 'cable', home: false },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscles: ['core'], equipment: 'bodyweight', home: true },
  { id: 'russian-twist', name: 'Russian Twist', muscles: ['core'], equipment: 'bodyweight', home: true },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscles: ['core'], equipment: 'bodyweight', home: true },
  { id: 'mountain-climber', name: 'Mountain Climber', muscles: ['core', 'cardio'], equipment: 'bodyweight', home: true },

  // ── Machines (gym alternatives) ────────────────────────
  { id: 'machine-chest-press', name: 'Machine Chest Press', muscles: ['chest', 'triceps'], equipment: 'machine', home: false },
  { id: 'machine-seated-fly', name: 'Pec Deck Fly', muscles: ['chest'], equipment: 'machine', home: false },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', muscles: ['shoulders'], equipment: 'machine', home: false },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', muscles: ['shoulders'], equipment: 'machine', home: false },
  { id: 'machine-seated-row', name: 'Machine Seated Row', muscles: ['back', 'biceps'], equipment: 'machine', home: false },
  { id: 'machine-preacher-curl', name: 'Machine Preacher Curl', muscles: ['biceps'], equipment: 'machine', home: false },
  { id: 'machine-seated-dip', name: 'Machine Seated Dip', muscles: ['triceps', 'chest'], equipment: 'machine', home: false },
  { id: 'hack-squat-machine', name: 'Hack Squat (Sled)', muscles: ['quads', 'glutes'], equipment: 'machine', home: false },
  { id: 'machine-seated-crunch', name: 'Machine Seated Crunch', muscles: ['core'], equipment: 'machine', home: false },

  // ── Full body / conditioning ───────────────────────────
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscles: ['full body', 'glutes'], equipment: 'kettlebell', home: false },
  { id: 'farmer-carry', name: 'Farmer Carry (secs as reps)', muscles: ['full body'], equipment: 'dumbbell', home: true },
  { id: 'burpee', name: 'Burpee', muscles: ['full body', 'cardio'], equipment: 'bodyweight', home: true },

  // ── Cardio (min + km) ──────────────────────────────────
  { id: 'running', name: 'Running', muscles: ['cardio'], equipment: 'cardio', home: true, cardio: true },
  { id: 'cycling', name: 'Cycling', muscles: ['cardio'], equipment: 'cardio', home: true, cardio: true },
  { id: 'incline-walk', name: 'Incline Walk', muscles: ['cardio'], equipment: 'cardio', home: true, cardio: true },
  { id: 'interval-sprints', name: 'Interval Sprints', muscles: ['cardio'], equipment: 'cardio', home: true, cardio: true },
  { id: 'rowing-machine', name: 'Rowing Machine', muscles: ['cardio', 'back'], equipment: 'cardio', home: false, cardio: true },
  { id: 'stair-climber', name: 'Stair Climber', muscles: ['cardio'], equipment: 'cardio', home: false, cardio: true },
  { id: 'jump-rope', name: 'Jump Rope', muscles: ['cardio'], equipment: 'cardio', home: true, cardio: true },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  return (
    byId.get(id) ?? {
      id,
      name: 'Unknown exercise',
      muscles: ['full body'],
      equipment: 'bodyweight',
      home: true,
    }
  );
}

/** Gym exercise -> closest home (bodyweight / dumbbell / pull-up bar) alternative. */
export const HOME_SWAP: Record<string, string> = {
  'bench-press': 'push-up',
  'incline-bench-press': 'decline-push-up',
  'incline-db-press': 'decline-push-up',
  'cable-fly': 'archer-push-up',
  'chest-dip': 'chair-dip',
  deadlift: 'db-rdl',
  'barbell-row': 'inverted-row',
  'lat-pulldown': 'pull-up',
  'seated-cable-row': 'db-row',
  'face-pull': 'rear-delt-fly',
  'back-extension': 'glute-bridge',
  shrug: 'farmer-carry',
  'overhead-press': 'pike-push-up',
  'barbell-curl': 'db-curl',
  'cable-pushdown': 'diamond-push-up',
  skullcrusher: 'overhead-triceps-ext',
  'close-grip-bench': 'diamond-push-up',
  squat: 'goblet-squat',
  'front-squat': 'goblet-squat',
  'leg-press': 'bulgarian-split-squat',
  'leg-extension': 'step-up',
  'leg-curl': 'single-leg-rdl',
  'romanian-deadlift': 'db-rdl',
  'hip-thrust': 'glute-bridge',
  'standing-calf-raise': 'bw-calf-raise',
  'seated-calf-raise': 'bw-calf-raise',
  'cable-crunch': 'bicycle-crunch',
  'kettlebell-swing': 'jump-squat',
  'rowing-machine': 'jump-rope',
  'stair-climber': 'jump-rope',
};

export interface MobilityMove {
  /** move name — also used as the GIF search query */
  name: string;
  dose: string;
}

const m = (name: string, dose: string): MobilityMove => ({ name, dose });

const WARMUPS: Partial<Record<MuscleGroup, MobilityMove[]>> = {
  chest: [m('Arm circles', 'x 20'), m('Scapular push-up', 'x 10'), m('Push-up', 'x 10 light')],
  shoulders: [m('Arm circles', 'x 20'), m('Shoulder dislocate', 'x 10 (towel/band)'), m('Elbow circles', 'x 10/side')],
  back: [m('Dead hang', '30s'), m('Scapular pull-up', 'x 8'), m('Cat cow', 'x 10')],
  biceps: [m('Biceps curl', 'x 15 light')],
  triceps: [m('Push-up', 'x 10 light')],
  quads: [m('Leg swing', 'x 15/side'), m('Squat', 'x 15 bodyweight'), m('Walking lunge', 'x 10/side')],
  hamstrings: [m('Leg swing', 'x 15/side'), m('Good morning', 'x 12 no weight'), m('Hip hinge', 'x 10')],
  glutes: [m('Glute bridge', 'x 15'), m('Hip circle', 'x 10/side')],
  calves: [m('Ankle circle', 'x 10/side'), m('Calf raise', 'x 15 slow')],
  core: [m('Cat cow', 'x 10'), m('Dead bug', 'x 10/side')],
  'full body': [m('Jumping jack', 'x 30'), m('Squat', 'x 10 bodyweight'), m('Arm circles', 'x 20')],
  cardio: [m('Walk', '3 min brisk, ramp to a light jog')],
};

const COOLDOWNS: Partial<Record<MuscleGroup, MobilityMove[]>> = {
  chest: [m('Chest stretch', '30s/side in a doorway')],
  shoulders: [m('Shoulder stretch', '30s/side cross-body')],
  back: [m('Child pose', '45s'), m('Lat stretch', '30s/side on doorframe')],
  biceps: [m('Biceps stretch', '30s/side on wall')],
  triceps: [m('Triceps stretch', '30s/side overhead')],
  quads: [m('Quadriceps stretch', '30s/side standing')],
  hamstrings: [m('Hamstring stretch', '45s seated forward fold')],
  glutes: [m('Piriformis stretch', '30s/side figure-4')],
  calves: [m('Calf stretch', '30s/side on wall')],
  core: [m('Upward stretch', '30s')],
  'full body': [m('Standing forward bend', '45s')],
  cardio: [m('Walk', '3 min slow, deep nasal breathing')],
};

function collect(
  map: Partial<Record<MuscleGroup, MobilityMove[]>>,
  muscles: MuscleGroup[]
): MobilityMove[] {
  const out: MobilityMove[] = [];
  for (const mg of muscles) {
    for (const move of map[mg] ?? []) {
      if (!out.some((x) => x.name === move.name)) out.push(move);
    }
  }
  return out;
}

export function warmupFor(muscles: MuscleGroup[]): MobilityMove[] {
  return collect(WARMUPS, muscles);
}

export function cooldownFor(muscles: MuscleGroup[]): MobilityMove[] {
  return [...collect(COOLDOWNS, muscles), m('Deep breathing', '2 min, slow')];
}

/**
 * Free-weight/bodyweight exercise -> machine alternative (gym only).
 * During a gym workout the user can switch an exercise to its machine variant
 * (or back); the workout logs whichever variant was actually performed.
 */
export const MACHINE_SWAP: Record<string, string> = {
  'bench-press': 'machine-chest-press',
  'db-bench-press': 'machine-chest-press',
  'incline-bench-press': 'machine-chest-press',
  'incline-db-press': 'machine-chest-press',
  'db-floor-press': 'machine-chest-press',
  'push-up': 'machine-chest-press',
  'cable-fly': 'machine-seated-fly',
  'chest-dip': 'machine-seated-dip',
  'chair-dip': 'machine-seated-dip',
  'overhead-press': 'machine-shoulder-press',
  'db-shoulder-press': 'machine-shoulder-press',
  'lateral-raise': 'machine-lateral-raise',
  'barbell-curl': 'machine-preacher-curl',
  'db-curl': 'machine-preacher-curl',
  'hammer-curl': 'machine-preacher-curl',
  skullcrusher: 'cable-pushdown',
  'overhead-triceps-ext': 'cable-pushdown',
  squat: 'hack-squat-machine',
  'front-squat': 'hack-squat-machine',
  'goblet-squat': 'leg-press',
  'bulgarian-split-squat': 'leg-press',
  'walking-lunge': 'leg-press',
  'romanian-deadlift': 'leg-curl',
  'db-rdl': 'leg-curl',
  deadlift: 'back-extension',
  'barbell-row': 'machine-seated-row',
  'db-row': 'machine-seated-row',
  'inverted-row': 'machine-seated-row',
  'pull-up': 'lat-pulldown',
  'chin-up': 'lat-pulldown',
  'bw-calf-raise': 'standing-calf-raise',
  'hanging-leg-raise': 'machine-seated-crunch',
};

/** Common form errors per exercise id — shown with the demo so users can avoid them. */
const MISTAKES: Record<string, string[]> = {
  'bench-press': ['Bouncing the bar off your chest', 'Flaring elbows to 90° — keep them ~45°', 'Lifting hips off the bench'],
  'incline-bench-press': ['Setting the bench too steep — 30° is plenty', 'Bouncing the bar off your chest'],
  'db-bench-press': ['Clanging the dumbbells together at the top', 'Flaring elbows to 90°'],
  'incline-db-press': ['Arching so much it becomes a flat press', 'Half range at the bottom'],
  'db-floor-press': ['Rushing the pause — let the triceps touch the floor briefly'],
  'cable-fly': ['Turning it into a press — keep a fixed elbow bend', 'Letting the weight yank your shoulders back'],
  'push-up': ['Hips sagging or piking up', 'Flaring elbows to 90°', 'Half reps — chest close to the floor'],
  'incline-push-up': ['Hips sagging', 'Hands too far forward'],
  'decline-push-up': ['Head diving before the chest', 'Hips piking'],
  'diamond-push-up': ['Elbows flaring wide — keep them tucked'],
  'archer-push-up': ['Twisting the hips toward the working arm'],
  'chest-dip': ['Shoulders rolling forward — keep the chest up', 'Cutting depth above 90°'],
  'chair-dip': ['Shoulders shrugging up to the ears', 'Drifting away from the chair'],
  deadlift: ['Rounding the lower back', 'Bar drifting away from the shins', 'Jerking the bar off the floor'],
  'barbell-row': ['Standing too upright', 'Heaving with the lower back', 'Pulling with arms instead of squeezing the shoulder blades'],
  'db-row': ['Rotating the torso to heave the weight up', 'Shrugging instead of rowing'],
  'lat-pulldown': ['Leaning far back and heaving', 'Half range — get a full stretch at the top'],
  'seated-cable-row': ['Rocking the torso back and forth', 'Shoulders rolling forward at the stretch'],
  'pull-up': ['Kipping / swinging', 'Half reps — chin over bar, full hang at the bottom'],
  'chin-up': ['Kipping / swinging', 'Stopping short of a full hang'],
  'inverted-row': ['Hips sagging', 'Half range — pull the chest to the bar'],
  'face-pull': ['Pulling to the chest instead of the face', 'Loading too heavy to control'],
  'back-extension': ['Hyperextending past neutral at the top', 'Rounding fast on the way down'],
  shrug: ['Rolling the shoulders — move straight up and down'],
  'overhead-press': ['Arching the lower back — squeeze your glutes', 'Pressing in front of the head instead of over it'],
  'db-shoulder-press': ['Arching the lower back', 'Stopping short of lockout'],
  'lateral-raise': ['Swinging the weights up', 'Raising above shoulder height', 'Shrugging — keep the traps relaxed'],
  'rear-delt-fly': ['Standing up as you lift — stay hinged', 'Using momentum'],
  'pike-push-up': ['Bending at the waist more as you press — keep the pike'],
  'handstand-push-up': ['Arching the back hard — brace the core'],
  'barbell-curl': ['Swinging the torso for momentum', 'Elbows drifting — upper arms stay pinned to your sides', 'Cutting the bottom range short'],
  'db-curl': ['Swinging the torso for momentum', 'Moving the elbows — the biceps work only when the upper arm is stationary'],
  'hammer-curl': ['Swinging the weights', 'Elbows drifting forward'],
  'cable-pushdown': ['Elbows drifting forward', 'Leaning body weight onto the cable'],
  skullcrusher: ['Flaring the elbows wide', 'Moving the upper arms — only the forearms move'],
  'overhead-triceps-ext': ['Flaring the elbows out', 'Arching the lower back'],
  'close-grip-bench': ['Gripping so narrow the wrists bend', 'Flaring elbows'],
  squat: ['Knees caving inward', 'Heels rising — keep weight mid-foot', 'Cutting depth — aim for thighs parallel or below'],
  'front-squat': ['Elbows dropping — keep them high', 'Knees caving inward'],
  'goblet-squat': ['Heels lifting', 'Rounding the upper back'],
  'leg-press': ['Going so deep the lower back rolls off the pad', 'Slamming the knees to lockout'],
  'leg-extension': ['Kicking the weight up with momentum'],
  'leg-curl': ['Lifting the hips off the pad'],
  'romanian-deadlift': ['Bending the knees too much — it becomes a squat', 'Rounding the back', 'Bar drifting away from the legs'],
  'db-rdl': ['Rounding the back', 'Squatting instead of hinging the hips back'],
  'single-leg-rdl': ['Hips opening sideways — keep them square', 'Rounding the back'],
  'bulgarian-split-squat': ['Front knee collapsing inward', 'Pushing off the rear foot'],
  'walking-lunge': ['Knee slamming the floor', 'Torso collapsing forward'],
  'step-up': ['Pushing off the bottom leg — the top leg does the work'],
  'hip-thrust': ['Overarching the lower back at the top — keep ribs down', 'Pushing through the toes instead of the heels'],
  'glute-bridge': ['Overarching at the top', 'Pushing through the toes'],
  'jump-squat': ['Landing stiff-legged — absorb softly', 'Knees caving on landing'],
  'wall-sit': ['Thighs above parallel', 'Hands pushing on the thighs'],
  'standing-calf-raise': ['Bouncing at the bottom', 'Partial range — full stretch, full squeeze'],
  'bw-calf-raise': ['Bouncing at the bottom', 'Rushing — pause at the top'],
  'seated-calf-raise': ['Bouncing the weight'],
  plank: ['Hips sagging', 'Butt too high', 'Holding your breath'],
  'hollow-hold': ['Lower back arching off the floor — press it down'],
  'hanging-leg-raise': ['Swinging for momentum', 'Lifting with hip flexors only — curl the pelvis up'],
  'cable-crunch': ['Pulling with the arms — crunch the ribs toward the hips'],
  'bicycle-crunch': ['Yanking the neck with your hands', 'Racing — slow rotation works better'],
  'russian-twist': ['Moving only the arms — rotate the whole torso'],
  'ab-wheel': ['Hips sagging / lower back arching — tuck the pelvis'],
  'mountain-climber': ['Hips bouncing upward'],
  'kettlebell-swing': ['Squatting instead of hinging', 'Lifting with the arms — it’s a hip snap'],
  'farmer-carry': ['Leaning to one side', 'Shrugging the shoulders up'],
  burpee: ['Sagging hips in the plank phase', 'Skipping the full hip extension at the top'],
  running: ['Running every session too fast — easy runs should be conversational'],
  'interval-sprints': ['Skipping the warmup before sprinting', 'Going 100% on the first interval'],
  'machine-chest-press': ['Setting the seat so handles sit above/below chest height', 'Shoulders rolling forward off the pad'],
  'machine-shoulder-press': ['Arching away from the backrest'],
  'machine-seated-row': ['Yanking with momentum', 'Shoulders rolling forward at the stretch'],
  'hack-squat-machine': ['Heels lifting off the plate', 'Bouncing at the bottom'],
  'machine-preacher-curl': ['Lifting elbows off the pad', 'Half range at the top'],
};

export function getMistakes(id: string): string[] {
  return MISTAKES[id] ?? [];
}

/** Live gym/home swap: in home mode, gym-only exercises resolve to their home alternative. */
export function resolveExerciseId(id: string, location: TrainLocation): string {
  if (location !== 'home') return id;
  if (getExercise(id).home) return id;
  return HOME_SWAP[id] ?? id;
}
