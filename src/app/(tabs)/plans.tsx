import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, Title, TrashConfirm } from '@/components/ui';
import { getExercise, resolveExerciseId } from '@/lib/exercises';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';

export default function Plans() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plans = useApp((s) => s.plans);
  const location = useApp((s) => s.profile.location);
  const createPlan = useApp((s) => s.createPlan);
  const deletePlan = useApp((s) => s.deletePlan);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 16,
        paddingBottom: 32 + insets.bottom,
      }}>
      <Title>PLANS</Title>
      <Dim>Tap a plan to edit it. Tap the trash twice to delete.</Dim>

      <Btn
        label="+ New Plan"
        style={{ marginTop: 16, marginBottom: 4 }}
        onPress={() => {
          const id = createPlan('New Plan');
          router.push({ pathname: '/plan/[id]', params: { id } });
        }}
      />

      {plans.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })}>
          {({ pressed }) => (
            <Card style={{ marginTop: 10, opacity: pressed ? 0.7 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: C.text, fontSize: F.h2, fontWeight: '700', flex: 1 }}>
                  {p.name}
                </Text>
                {p.fromGoal && (
                  <Text style={{ color: C.ember, fontSize: F.small, fontWeight: '700', marginRight: 10 }}>
                    GENERATED
                  </Text>
                )}
                <TrashConfirm size={18} onDelete={() => deletePlan(p.id)} />
              </View>
              <Dim small>
                {p.exercises.length === 0
                  ? 'Empty — tap to add exercises'
                  : p.exercises
                      .slice(0, 4)
                      .map((e) => getExercise(resolveExerciseId(e.exerciseId, location)).name)
                      .join(' · ') + (p.exercises.length > 4 ? ` · +${p.exercises.length - 4} more` : '')}
              </Dim>
            </Card>
          )}
        </Pressable>
      ))}

      {plans.length === 0 && (
        <Dim>No plans yet. Create one, or pick a physique goal on the Home tab.</Dim>
      )}
    </ScrollView>
  );
}
