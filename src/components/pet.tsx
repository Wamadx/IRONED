import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import { C, F } from '@/lib/theme';

interface PetDef {
  name: string;
  icon: keyof typeof Ionicons.glyphMap | null; // null = drawn slime
  color: string;
  desc: string;
}

/** companion grows with rank — a mirror of the hunter's strength */
const PETS: Record<string, PetDef> = {
  E: { name: 'Common Slime', icon: null, color: '#7CD65C', desc: 'Squishy. Loyal. Weak — for now.' },
  D: { name: 'Gray Wolf Pup', icon: 'paw', color: '#9AA5B1', desc: 'Fast learner, sharp teeth.' },
  C: { name: 'Stone Golem', icon: 'cube', color: '#B08D57', desc: 'Slow, unbreakable, dependable.' },
  B: { name: 'Flame Drake', icon: 'flame', color: '#FF7A3C', desc: 'Burns brighter every session.' },
  A: { name: 'High Orc Shade', icon: 'skull', color: '#B266FF', desc: 'A fallen elite, bound to you.' },
  S: { name: 'Monarch’s Knight', icon: 'flash', color: '#FF3B5C', desc: 'Arise. It kneels to no one else.' },
};

/** Little companion beside the rank display — evolves as the hunter ranks up. */
export function RankPet({ rank }: { rank: string }) {
  const pet = PETS[rank] ?? PETS.E;
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);
  return (
    <View style={{ alignItems: 'center', maxWidth: 110 }}>
      <Animated.View
        style={{
          transform: [
            { translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
            { scaleX: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, rank === 'E' ? 1.08 : 1] }) },
            { scaleY: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, rank === 'E' ? 0.92 : 1] }) },
          ],
        }}>
        {pet.icon === null ? (
          // hand-drawn slime: squishy blob with eyes
          <View
            style={{
              width: 52,
              height: 42,
              backgroundColor: pet.color,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 18,
              borderWidth: 2.5,
              borderColor: '#1c3311',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              paddingTop: 6,
            }}>
            <View style={{ width: 6, height: 9, borderRadius: 3, backgroundColor: '#1c3311' }} />
            <View style={{ width: 6, height: 9, borderRadius: 3, backgroundColor: '#1c3311' }} />
          </View>
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 20,
              borderTopRightRadius: 6,
              backgroundColor: C.cardAlt,
              borderWidth: 2.5,
              borderColor: pet.color,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={pet.icon} size={26} color={pet.color} />
          </View>
        )}
      </Animated.View>
      <Text style={{ color: C.text, fontSize: F.small, fontWeight: '700', marginTop: 6, textAlign: 'center' }}>
        {pet.name}
      </Text>
      <Text style={{ color: C.textFaint, fontSize: F.small - 1, textAlign: 'center' }}>{pet.desc}</Text>
    </View>
  );
}
