import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ConfirmBtn, Dim, H2, NumInput } from '@/components/ui';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const meal = useApp((s) => s.meals.find((m) => m.id === id));
  const updateMeal = useApp((s) => s.updateMeal);
  const deleteMeal = useApp((s) => s.deleteMeal);
  const toggleFavoriteMeal = useApp((s) => s.toggleFavoriteMeal);

  if (!meal) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <Dim>This meal no longer exists.</Dim>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: meal.desc }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
        keyboardShouldPersistTaps="handled">
        {meal.photoUri && (
          <Image
            source={{ uri: meal.photoUri }}
            style={{ width: '100%', height: 240, borderRadius: 12, backgroundColor: C.card }}
            contentFit="cover"
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}>
          <Dim small>{new Date(meal.time).toLocaleString()}</Dim>
          <Pressable
            hitSlop={10}
            onPress={() => toggleFavoriteMeal(meal.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons
              name={meal.favorite ? 'star' : 'star-outline'}
              size={18}
              color={meal.favorite ? C.ember : C.textFaint}
            />
            <Text style={{ color: meal.favorite ? C.ember : C.textFaint, fontSize: F.small }}>
              {meal.favorite ? 'favourite' : 'add to favourites'}
            </Text>
          </Pressable>
        </View>

        {meal.items && meal.items.length > 0 && (
          <Card style={{ marginTop: 12, borderColor: C.ember }}>
            <H2>Breakdown</H2>
            {meal.items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={{ marginTop: 6 }}>
                <Text style={{ color: C.text, fontSize: F.body, fontWeight: '600' }}>
                  {it.name} <Dim small>~{it.grams}g</Dim>
                </Text>
                <Dim small>
                  {it.kcal} kcal · P {it.protein}g · C {it.carbs}g · F {it.fat}g
                </Dim>
              </View>
            ))}
          </Card>
        )}

        <Card style={{ marginTop: 12 }}>
          <H2>Edit meal</H2>
          <Dim small>Fix anything you keyed wrongly — changes save instantly.</Dim>
          <TextInput
            defaultValue={meal.desc}
            onEndEditing={(e) => {
              const t = e.nativeEvent.text.trim();
              if (t) updateMeal(meal.id, { desc: t });
            }}
            placeholder="Meal name / description"
            placeholderTextColor={C.textFaint}
            style={{
              backgroundColor: C.cardAlt,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 8,
              color: C.text,
              padding: 10,
              marginTop: 10,
            }}
          />
          {(
            [
              ['Calories (kcal)', 'kcal'],
              ['Protein (g)', 'protein'],
              ['Carbs (g)', 'carbs'],
              ['Fat (g)', 'fat'],
              ['Sodium (mg)', 'sodium'],
            ] as const
          ).map(([label, key]) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <Text style={{ color: C.textDim, fontSize: F.body }}>{label}</Text>
              <NumInput
                value={meal[key] ?? 0}
                onChange={(n) => updateMeal(meal.id, { [key]: Math.max(0, Math.round(n)) })}
              />
            </View>
          ))}
        </Card>

        <ConfirmBtn
          label="Delete Meal"
          confirmLabel="Tap again to delete"
          style={{ marginTop: 8 }}
          onConfirm={() => {
            deleteMeal(meal.id);
            router.back();
          }}
        />
      </ScrollView>
    </>
  );
}
