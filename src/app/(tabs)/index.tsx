import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, Title } from '@/components/ui';
import { getGoal } from '@/lib/physique';
import { slotForDate } from '@/lib/schedule';
import { useApp } from '@/lib/store';
import { C, F, S } from '@/lib/theme';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useApp((s) => s.hydrated);
  const profile = useApp((s) => s.profile);
  const plans = useApp((s) => s.plans);
  const workouts = useApp((s) => s.workouts);
  const active = useApp((s) => s.active);
  const startWorkout = useApp((s) => s.startWorkout);
  const setLocation = useApp((s) => s.setLocation);
  const schedule = useApp((s) => s.schedule);
  const scheduleMode = useApp((s) => s.scheduleMode);
  const cycle = useApp((s) => s.cycle);
  const cycleStart = useApp((s) => s.cycleStart);
  const greeting = useApp((s) => s.greeting);

  if (!hydrated) return null;
  if (!profile.onboarded) return <Redirect href="/onboarding" />;

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = workouts.filter((w) => w.finishedAt > weekAgo).length;
  const goal = profile.goal ? getGoal(profile.goal) : null;

  const todaySlot = slotForDate(scheduleMode, schedule, cycle, cycleStart, Date.now());
  const todayPlan = todaySlot && todaySlot !== 'rest' ? plans.find((p) => p.id === todaySlot) : null;

  const lastWorkoutToday = workouts.find((w) => {
    const d1 = new Date(w.finishedAt);
    const d2 = new Date();
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  });

  const finishedToday = !!lastWorkoutToday;
  const hasSchedule = todaySlot != null;
  const isRestDay = todaySlot === 'rest';
  const matchesSchedule = hasSchedule
    ? (isRestDay ? false : lastWorkoutToday?.planId === todaySlot)
    : true;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        // alien tab bar floats over content — leave room so nothing hides behind it
        paddingBottom: 32 + insets.bottom + (S.freeform ? 84 : 0),
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>{greeting}</Title>
        <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="settings-outline" size={24} color={C.textDim} />
        </Pressable>
      </View>
      <Dim>
        {thisWeek} workout{thisWeek === 1 ? '' : 's'} in the last 7 days
      </Dim>

      {finishedToday && matchesSchedule && !active && (
        <Card style={{ marginTop: 16, borderColor: C.smoke }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={16} color={C.red} />
            <H2>Done for the day</H2>
          </View>
          <Dim>You have completed your scheduled workout. Rest and recover, Hunter!</Dim>
        </Card>
      )}

      {finishedToday && !matchesSchedule && !active && (
        <Card style={{ marginTop: 16, borderColor: C.ember }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning" size={16} color={C.ember} />
            <H2>Workout done, but not scheduled</H2>
          </View>
          <Text style={{ color: C.textDim, fontSize: F.body, marginBottom: 6 }}>
            {isRestDay
              ? 'You completed a workout today, but today was scheduled as a Rest Day.'
              : `You completed a different workout today than your scheduled quest: "${todayPlan?.name}".`}
          </Text>
          {todayPlan && (
            <Btn
              label={`Start Scheduled Quest: ${todayPlan.name}`}
              style={{ marginTop: 8 }}
              onPress={() => {
                startWorkout(todayPlan.id);
                router.push('/workout/active');
              }}
            />
          )}
        </Card>
      )}

      {!finishedToday && todaySlot === 'rest' && !active && (
        <Card style={{ marginTop: 16, borderColor: C.smoke }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="moon" size={16} color={C.textDim} />
            <H2>Scheduled rest day</H2>
          </View>
          <Dim>Recovery is training too. Your streak is safe.</Dim>
        </Card>
      )}
      {!finishedToday && todayPlan && !active && (
        <Card style={{ marginTop: 16, borderColor: C.ember }}>
          <Dim small>TODAY’S QUEST</Dim>
          <H2>{todayPlan.name}</H2>
          <Btn
            label="Start Today’s Workout"
            style={{ marginTop: 10 }}
            onPress={() => {
              startWorkout(todayPlan.id);
              router.push('/workout/active');
            }}
          />
        </Card>
      )}

      {active && (
        <Card style={{ marginTop: 16, borderColor: C.red }}>
          <H2>{active.lastResumedAt === null ? 'Workout paused ⏸' : 'Workout in progress'}</H2>
          <Dim>
            {active.name}
            {active.lastResumedAt === null ? ' — timer is stopped, resume when ready' : ''}
          </Dim>
          <Btn
            label="Open Workout"
            onPress={() => router.push('/workout/active')}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {goal && (
        <Card style={{ marginTop: active ? 0 : 16 }}>
          <Dim small>YOUR TARGET PHYSIQUE</Dim>
          <H2>{goal.title}</H2>
          <Dim>{goal.tagline}</Dim>
          <Dim small>
            {goal.daysPerWeek} · cardio: {goal.cardio}
          </Dim>
          <Btn
            label="Change goal"
            kind="ghost"
            onPress={() => router.push('/onboarding')}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      <Card>
        <Dim small>TRAINING MODE — switches every plan live</Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(['gym', 'home'] as const).map((loc) => (
            <Btn
              key={loc}
              label={loc === 'gym' ? 'Gym' : 'Home'}
              icon={loc === 'gym' ? 'barbell' : 'home'}
              kind={profile.location === loc ? 'primary' : 'ghost'}
              style={{ flex: 1 }}
              onPress={() => setLocation(loc)}
            />
          ))}
        </View>
        <Dim small>
          Home mode swaps gym-only exercises for bodyweight, dumbbell and pull-up bar versions.
        </Dim>
      </Card>

      <H2>Start a workout</H2>
      {plans.length === 0 && (
        <Dim>No plans yet — create one in the Plans tab, or pick a goal above.</Dim>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {plans.map((p) => (
          <Pressable
            key={p.id}
            style={{ width: '48.5%' }}
            onPress={() => {
              startWorkout(p.id);
              router.push('/workout/active');
            }}>
            {({ pressed }) => (
              <Card style={{ marginTop: 10, marginBottom: 0, minHeight: 96, opacity: pressed ? 0.7 : 1 }}>
                <Text style={{ color: C.text, fontSize: F.body, fontWeight: '700' }} numberOfLines={2}>
                  {p.name}
                </Text>
                <Dim small>{p.exercises.length} exercises</Dim>
                <Text style={{ color: C.red, fontSize: F.h2, fontWeight: '800', marginTop: 6 }}>▶</Text>
              </Card>
            )}
          </Pressable>
        ))}
      </View>

      <Btn
        label="Empty Quick Workout"
        kind="ghost"
        style={{ marginTop: 12 }}
        onPress={() => {
          startWorkout(undefined);
          router.push('/workout/active');
        }}
      />
    </ScrollView>
  );
}
