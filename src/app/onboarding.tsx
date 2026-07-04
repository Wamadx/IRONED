import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, Title } from '@/components/ui';
import { PHYSIQUE_GOALS } from '@/lib/physique';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';
import type { PhysiqueGoalId, TrainLocation } from '@/lib/types';

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useApp((s) => s.profile);
  const setGoal = useApp((s) => s.setGoal);
  const finishOnboarding = useApp((s) => s.finishOnboarding);

  const [picked, setPicked] = useState<PhysiqueGoalId | null>(profile.goal ?? null);
  const [location, setLocation] = useState<TrainLocation>(profile.location);

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 24,
        paddingBottom: 48 + insets.bottom,
      }}>
      <Title>WHAT ARE YOU BUILDING?</Title>
      <Dim>
        Pick the physique you want. Your training split — and how much cardio is in it — is generated
        to match. You can edit everything later.
      </Dim>

      <View style={{ marginTop: 20 }}>
        {PHYSIQUE_GOALS.map((g) => {
          const sel = picked === g.id;
          return (
            <Pressable key={g.id} onPress={() => setPicked(g.id)}>
              <Card style={{ borderColor: sel ? C.red : C.border, borderWidth: sel ? 2 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <H2>{g.title}</H2>
                  {sel && <Text style={{ color: C.red, fontWeight: '800' }}>✓</Text>}
                </View>
                <Text style={{ color: C.ember, fontSize: F.body, marginTop: 2 }}>{g.tagline}</Text>
                <Dim>{g.description}</Dim>
                <Dim small>
                  {g.daysPerWeek} · cardio: {g.cardio}
                </Dim>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <H2>Where do you train?</H2>
      <Dim small>
        Home mode swaps gym machines for bodyweight, dumbbell and pull-up bar alternatives.
      </Dim>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 }}>
        {(['gym', 'home'] as const).map((loc) => (
          <Btn
            key={loc}
            label={loc === 'gym' ? 'Gym' : 'Home'}
            kind={location === loc ? 'primary' : 'ghost'}
            style={{ flex: 1 }}
            onPress={() => setLocation(loc)}
          />
        ))}
      </View>

      <Btn
        label={picked ? 'Generate my split' : 'Pick a physique first'}
        onPress={() => {
          if (!picked) return;
          setGoal(picked, location);
          done();
        }}
      />
      <Btn
        label="Skip — I’ll build my own plans"
        kind="ghost"
        style={{ marginTop: 10 }}
        onPress={() => {
          finishOnboarding();
          done();
        }}
      />
      {profile.goal && (
        <Dim small>
          Heads-up: generating a new split replaces the previous generated plans. Plans you created
          yourself are kept.
        </Dim>
      )}
    </ScrollView>
  );
}
