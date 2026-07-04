import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Card, Dim, H2 } from '@/components/ui';
import { getExercise } from '@/lib/exercises';
import { doneSets, useApp, workoutVolume } from '@/lib/store';
import { C, F } from '@/lib/theme';
import { prBonus, workoutPRs, workoutXp } from '@/lib/xp';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useApp((s) => s.workouts);
  const workout = workouts.find((w) => w.id === id);
  const unit = useApp((s) => s.unit);

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <Dim>This workout no longer exists.</Dim>
      </View>
    );
  }

  const vol = workoutVolume(workout.exercises);
  const prs = workoutPRs(workouts, workout.id);
  const xp = workoutXp(workout);
  const bonus = prBonus(prs.length);

  return (
    <>
      <Stack.Screen options={{ title: workout.name }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Dim>
          {new Date(workout.finishedAt).toLocaleString()} · {doneSets(workout.exercises)} sets done
          {vol > 0 ? ` · ${Math.round(vol).toLocaleString()} ${unit} total volume` : ''}
          {workout.location ? ` · ${workout.location === 'home' ? 'home version' : 'gym version'}` : ''}
        </Dim>
        <Text style={{ color: C.ember, fontSize: F.h2, fontWeight: '800', marginTop: 6 }}>
          +{xp + bonus} XP{bonus > 0 ? `  (${xp} + ${bonus} PR bonus)` : ''}
        </Text>
        {prs.map((pr) => (
          <View key={pr.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <Ionicons name="trophy" size={14} color={C.ember} />
            <Text style={{ color: C.ember, fontSize: F.body }}>
              PR — {getExercise(pr.exerciseId).name}: {pr.weight} {unit} × {pr.reps}
            </Text>
          </View>
        ))}

        {workout.exercises.map((we, i) => {
          const ex = getExercise(we.exerciseId);
          return (
            <Card key={`${we.exerciseId}-${i}`} style={{ marginTop: 12 }}>
              <H2>{ex.name}</H2>
              {we.sets.map((st, si) => (
                <View key={si} style={{ flexDirection: 'row', marginTop: 4 }}>
                  <Text style={{ color: C.textDim, width: 30, fontSize: F.body }}>{si + 1}</Text>
                  <Text style={{ color: st.done ? C.text : C.textFaint, fontSize: F.body }}>
                    {ex.cardio ? `${st.weight} km in ${st.reps} min` : `${st.weight} ${unit} × ${st.reps}`}
                    {st.done ? '' : '  (skipped)'}
                  </Text>
                </View>
              ))}
            </Card>
          );
        })}
      </ScrollView>
    </>
  );
}
