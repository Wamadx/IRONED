# mort_HEVYclone — Feature Spec

Workout tracker (Hevy-style) + Solo Leveling gamification + meal tracker.
**Principles: no login, no paywall, offline-first. All data stored locally on device.**

---

## 1. Core workout tracking (Hevy clone)

- [ ] Exercise library with demo **GIFs/images** per exercise
  - Source: bundle the free MIT-licensed exercise dataset (yuhonas/free-exercise-db, ~870 exercises with images) or pull from the wger.de open API. ExerciseDB on RapidAPI has true GIFs but rate limits/licensing — decide later.
- [x] Log workouts: per-set **custom reps + weight** (each set independent)
- [ ] Set types: normal, warmup, dropset, failure
- [x] **Custom plans (routines)**: create, edit, delete, custom names
- [x] Plan editor: pick exercises from library, set default sets/reps/weight (reorder: TODO)
- [x] **Rest timer**: custom duration per exercise, auto-starts when a set is checked off, vibrates when done (+15s/-15s/skip)
- [x] During workout: show previous performance per exercise ("Last time: 60kg×8")
- [x] Workout history: list + per-workout detail (calendar view: TODO)

### Also done in v1
- [x] **Physique goal picker** (onboarding): Lean & Athletic (Jin-Woo), Muscular, Strong, Hybrid, Cut — each generates a split with matched cardio volume
- [x] Gym/Home mode: home mode swaps machines for bodyweight/dumbbell/pull-up bar alternatives
- [x] Warmup suggestions matched to the day's muscle groups + cooldown list
- [x] Cardio exercises logged as km + minutes
- [x] Dark red grungy theme

## 2. Gamification (Arise / Solo Leveling style)

+ allow user defined split days and rest days. this ensure user follows schedule.

- [ ] **XP system**: earn XP per set, per workout completion, per streak day
- [ ] **Level + Rank**: E → D → C → B → A → S rank progression
- [ ] **Stats**: STR (lifting volume), VIT (consistency/streaks), AGI (cardio), etc. — grow from actual training data
- [ ] Level-up animation + titles/achievements ("Shadow Monarch" at S rank, first PR, 7-day streak…)
- [ ] PR (personal record) auto-detection → bonus XP + badge

## 3. Plans / Splits

- [ ] Built-in **Sung Jin-Woo split** (Daily Quest + strength days)
- [ ] Classic splits included as presets: PPL (push/pull/legs), Upper/Lower, Full Body 3x
- [ ] **Cardio as first-class exercises**: running, cycling (distance, time, pace) — logged and feeding AGI stat
- [ ] **Home version toggle per plan**: each plan has a gym version and a home version (bodyweight, dumbbells, pull-up bar only); one tap to switch
- [ ] Home exercise pool (suggestions):
  - Push: push-up variants (incline, decline, diamond, archer, pike), dumbbell floor press, chair dips, pike push-ups → handstand push-up progression
  - Pull: pull-ups, chin-ups, inverted rows under a table, dumbbell rows, dead hangs
  - Legs: Bulgarian split squats, goblet squats, walking lunges, dumbbell Romanian deadlifts, step-ups, glute bridges / hip thrusts, calf raises, wall sits, jump squats
  - Shoulders/arms: dumbbell shoulder press, lateral raises, hammer curls, overhead triceps extension
  - Core: planks, hollow holds, hanging leg raises (bar), bicycle crunches, mountain climbers
  - Conditioning: burpees, jump rope, stair runs, farmer carries

## 4. Warmups & cooldowns

- [ ] Each plan/day gets an auto-suggested **dynamic warmup** matched to the muscle groups trained that day
  - Leg day: leg swings, hip circles, bodyweight squats, walking lunges, glute bridges
  - Push day: arm circles, shoulder dislocates, scapular push-ups, light push-ups
  - Pull day: dead hangs, scapular pulls, band/towel pull-aparts, cat-cow
  - Cardio: brisk walk → light jog ramp
- [ ] **Warmup sets calculator** for first heavy lift (e.g. 40% × 8, 60% × 5, 80% × 3 of working weight)
- [ ] **Cooldown** after finishing: static stretches for the muscles trained + 2-min breathing; small XP bonus for completing it

## 5. Meal tracker

- [ ] Take a **photo of food** → AI suggests items + carbs/fat/protein/calories breakdown
- [ ] User can add/correct: type food name, weight in grams, or items not visible in photo
- [ ] Text-only entry path (no photo) with food database search
- [ ] Barcode scanner for packaged foods (Open Food Facts — free, no key)
- [ ] **Daily goals: calories, protein, carbs, fat** — progress rings/bars
- [ ] Recent foods / favorites / saved meals for one-tap logging
- [ ] Meal history per day, daily totals vs goals

### AI backend decision (photo → macros)

+ allow user to add their own gemini api key with popup window guide on how to add theirs to enable this feature if theyre not me. for now, u can use my key just for me as admin login.
**Recommended: Google Gemini API free tier** (aistudio.google.com — this works with your Google account/Cloud project):
- Gemini Flash accepts an image + text prompt and returns structured JSON (foods, estimated grams, macros) in one call. No food-specific model needed.
- Free tier is plenty for personal use (per-minute + daily request caps). $0.
- Combine with **USDA FoodData Central API** (free key) or **Open Food Facts** (free, no key) for accurate text/barcode lookups so Gemini is only needed for photos.

**On-device custom model?** Not recommended for v1: food-recognition TFLite models can classify a dish but are poor at portion size + macro estimation, and won't run in Expo Go without a dev build. Revisit only if offline photo analysis becomes a must.

Note: with no login, the API key ships inside the app. Fine for personal/side-loaded use; if you ever publish it, put the key behind a tiny free proxy (Cloudflare Workers free tier) instead.

## 6. Suggested extra features (pick what you like)

**Progress & data**
- Charts: volume per muscle group, estimated 1RM over time, body-weight trend
- Body measurements log (waist, arms, chest…) + progress photos (local only)
- Calendar heatmap of training days (GitHub-style)
- **Export/backup to JSON/CSV file** — important: no login means no cloud backup, so one-tap export to phone storage / share sheet

**Workout QoL**
- Plate calculator (what plates to load for a target weight)
- Supersets support in plan editor
- RPE / notes per set
- Workout reminders for that day if not resting

**Health extras**
- Water intake tracker (fits the goals screen)
- Weekly summary ("Hunter Weekly Report"): volume, XP gained, quests done, calorie adherence

**Theme**
- red alt grungey style/chains/smokes

---

## Status (built so far)

**Workouts**: plans (create/rename/delete/reorder via drag or arrows, collapsible cards), per-set reps/weight logging, auto rest timer (+15/−15/skip), pause/resume with honest training time, finish-early friendly, "last time" per exercise, machine-variant switch mid-workout (logged correctly), live gym/home toggle with exercise swaps, warmups & cooldowns matched to muscles, animated demos for every move (cached locally, one API call per demo ever) + mistake warnings + YouTube link, exercise picker with demo previews.

**Gamification**: XP per workout (sets/volume/cardio bonuses), levels, ranks E→S with titles, STR/AGI/VIT stats, day streak, weekly summary, per-workout +XP.

**Meals**: photo → Gemini macro breakdown (items + totals, editable), manual entry, photos saved with meals, meal detail view with breakdown + post-hoc editing, daily kcal/protein/carb/fat goals with progress bars, history by day.

**Misc**: physique-goal onboarding generating splits (5 goals), safe-area handling for nav-button devices, tap-twice confirms everywhere, reset-all-data button (Hunter tab), red/dark theme, PR auto-detection (est. 1RM based, +25 XP each, capped 75/workout) with 🏆 badges in workout detail, 12 achievements grid, weekly Hunter Report (volume/XP/kcal adherence), calendar heatmap (12 weeks), JSON export/import backup via share sheet, plate calculator on barbell exercises, water tracker with goal, keep-screen-awake during workouts.

## Standalone app plan (no Expo Go)

Goal: downloadable APK (and maybe iOS). Path: **EAS Build** — `npx eas-cli build -p android --profile preview` produces an installable APK; iOS needs an Apple Developer account ($99/yr). Everything used so far is standalone-compatible. Before first build: app icon/splash, move API keys from `src/lib/config.ts` to an in-app settings screen, pick an Android package name.

**Settings & schedule** (added later): settings screen (gear on Home) with kg/lb unit toggle, bar weight, user-provided API keys with how-to guides (override baked dev keys), weekly split schedule (plan or 🌙 rest per weekday) driving a "Today's quest" card on Home, workout reminder notifications (per scheduled day, unreliable in Expo Go / fine standalone), rest-day-aware streaks (scheduled rest days keep streaks alive, runs need ≥1 real workout). Keep-awake removed by request.

**Later additions**: spotlight two-tap confirms (dim everything but the button), collapsible exercises in-workout with completion bars, muscles shown per exercise, variation cycling (same muscle group / other cardio), machine variants, clickable local-timezone heatmap, export to Downloads (SAF), TDEE goal calculator with weekly-rate bulking/cutting + target-weight ETA, merged goals editor, quick-add recent meals, weekly volume chart, fake-history seeder, theme system (dark/light/beige background × 5 accents), custom greeting, icons everywhere.

**Final feature wave**: level-up animation, per-exercise est-1RM trend (Hunter), body measurements + progress photos screen, supersets (plan link + no-rest-between in workout), barcode scanner with Open Food Facts → USDA FDC fallback, sodium tracking (goals/AI/barcode/edit), favourites + quick-add meals, collapsible meal history days, photos embedded in JSON backups, swipe between tabs, font-size setting, Y2K retro UI flavor, hardened import with diagnostic errors.

## Next (the finale)

- [ ] **Rename the app** (display name, slug in app.json, Android package name)
- [ ] **EAS Build** → installable APK (icon, package name — keys already user-settable)

## Storage & tech notes

- zustand + AsyncStorage for all data (works in Expo Go), no accounts, no server
- Demo GIFs/frames download once into app storage (`gif-cache/`), meal photos into `meal-photos/`
- Camera via expo-image-picker (works in Expo Go); Gemini + ExerciseDB keys in `src/lib/config.ts` — do NOT commit publicly
- Drag reorder via react-native-sortables; reset-all wipes storage + cached files
