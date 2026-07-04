import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Text, View } from 'react-native';

import { Btn } from '@/components/ui';
import { C, F } from '@/lib/theme';
import { rankFor } from '@/lib/xp';

const { width: W, height: H } = Dimensions.get('window');

/** three diagonal blade streaks sweeping across the screen */
function SamuraiSlashes() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    Animated.stagger(
      140,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 260, useNativeDriver: true })
      )
    ).start();
  }, [anims]);
  return (
    <>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: H * (0.25 + i * 0.2),
            left: -W,
            width: W * 3,
            height: 3 + i * 2,
            backgroundColor: '#fff',
            shadowColor: C.red,
            shadowRadius: 16,
            shadowOpacity: 1,
            transform: [
              { rotate: `${-24 + i * 9}deg` },
              {
                translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-W * 1.5, W * 1.5] }),
              },
            ],
            opacity: a.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          }}
        />
      ))}
    </>
  );
}

/** horizontal strips jittering sideways — VHS screen-tear glitch */
function ScreenTear() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]),
      { iterations: 7 }
    ).start();
  }, [a]);
  const strips = 9;
  return (
    <>
      {Array.from({ length: strips }, (_, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (H / strips) * i,
            left: 0,
            right: 0,
            height: H / strips - 2,
            backgroundColor: i % 3 === 0 ? C.red : i % 3 === 1 ? C.ember : '#fff',
            opacity: 0.12 + (i % 3) * 0.05,
            transform: [
              {
                translateX: a.interpolate({
                  inputRange: [0, 1],
                  outputRange: [i % 2 === 0 ? -26 : 26, i % 2 === 0 ? 18 : -18],
                }),
              },
            ],
          }}
        />
      ))}
    </>
  );
}

/** the screen is a wall — impact ring, cracks, then shards blast outward */
function PunchWall() {
  const impact = useRef(new Animated.Value(0)).current;
  const shatter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(impact, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.delay(120),
      Animated.timing(shatter, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [impact, shatter]);

  // 6 wall shards covering the screen in a 2×3 grid, each flying out its own way
  const shards = [
    { top: 0, left: 0, dx: -W, dy: -H * 0.4, rot: '-38deg' },
    { top: 0, left: W / 2, dx: W, dy: -H * 0.5, rot: '31deg' },
    { top: H / 3, left: 0, dx: -W * 1.2, dy: H * 0.1, rot: '-24deg' },
    { top: H / 3, left: W / 2, dx: W * 1.2, dy: 0, rot: '42deg' },
    { top: (H * 2) / 3, left: 0, dx: -W, dy: H * 0.5, rot: '27deg' },
    { top: (H * 2) / 3, left: W / 2, dx: W, dy: H * 0.6, rot: '-33deg' },
  ];
  const cracks = [-70, -25, 10, 55, 80, -50];
  return (
    <>
      {shards.map((s, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: W / 2 + 2,
            height: H / 3 + 2,
            backgroundColor: C.smoke,
            borderWidth: 1,
            borderColor: '#000',
            opacity: shatter.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0.9, 0] }),
            transform: [
              { translateX: shatter.interpolate({ inputRange: [0, 1], outputRange: [0, s.dx] }) },
              { translateY: shatter.interpolate({ inputRange: [0, 1], outputRange: [0, s.dy] }) },
              { rotate: shatter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', s.rot] }) },
            ],
          }}
        />
      ))}
      {/* crack lines radiating from the impact point */}
      {cracks.map((deg, i) => (
        <Animated.View
          key={`c${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: H / 2,
            left: W / 2 - 90,
            width: 180 + i * 26,
            height: 2,
            backgroundColor: '#fff',
            opacity: impact.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 0.9] }),
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
      {/* impact shockwave ring */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: H / 2 - 60,
          left: W / 2 - 60,
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 5,
          borderColor: C.ember,
          opacity: impact.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
          transform: [{ scale: impact.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2.6] }) }],
        }}
      />
    </>
  );
}

/** lightning storm: double white flash, spinning god-rays, stray bolts popping in around center */
function BoltStorm() {
  const flash = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const pops = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    // two hard white flashes like a lightning strike
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.delay(70),
      Animated.timing(flash, { toValue: 0.8, duration: 50, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: true })
    ).start();
    Animated.stagger(
      130,
      pops.map((p) =>
        Animated.sequence([
          Animated.spring(p, { toValue: 1, friction: 3, useNativeDriver: true }),
          Animated.timing(p, { toValue: 0, duration: 500, delay: 350, useNativeDriver: true }),
        ])
      )
    ).start();
  }, [flash, spin, pops]);
  const boltSpots = [
    { top: H * 0.22, left: W * 0.14, size: 34, rot: '-18deg' },
    { top: H * 0.3, left: W * 0.74, size: 44, rot: '14deg' },
    { top: H * 0.68, left: W * 0.2, size: 40, rot: '9deg' },
    { top: H * 0.64, left: W * 0.7, size: 30, rot: '-11deg' },
  ];
  return (
    <>
      {/* rotating god-rays behind the number */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: H / 2 - 160,
          left: W / 2 - 160,
          width: 320,
          height: 320,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          opacity: 0.35,
        }}>
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 320,
              height: 10,
              backgroundColor: C.red,
              transform: [{ rotate: `${i * 30}deg` }],
            }}
          />
        ))}
      </Animated.View>
      {/* stray bolts popping around the screen */}
      {boltSpots.map((b, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: b.top,
            left: b.left,
            opacity: pops[i],
            transform: [{ rotate: b.rot }, { scale: pops[i] }],
          }}>
          <Ionicons name="flash" size={b.size} color={C.ember} />
        </Animated.View>
      ))}
      {/* full-screen strike flash */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
          opacity: flash,
        }}
      />
    </>
  );
}

const VARIANTS = ['bolt', 'slash', 'tear', 'punch'] as const;
const REVEAL_DELAY: Record<(typeof VARIANTS)[number], number> = {
  bolt: 200,
  slash: 450,
  tear: 450,
  punch: 700,
};

/** Full-screen celebration; cycles randomly between bolt / slash / tear / punch effects. */
export function LevelUpOverlay({ level, onDone }: { level: number; onDone: () => void }) {
  const variant = useRef(VARIANTS[Math.floor(Math.random() * VARIANTS.length)]).current;
  const scale = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = REVEAL_DELAY[variant]; // let the effect land first
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    if (variant !== 'bolt') {
      // small camera shake while the effect plays
      Animated.loop(
        Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]),
        { iterations: 6 }
      ).start();
    }
  }, [variant, scale, opacity, glow, shake]);

  const rank = rankFor(level);
  return (
    <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={onDone}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.93)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          transform: [
            { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) },
          ],
        }}>
        {variant === 'bolt' && <BoltStorm />}
        {variant === 'slash' && <SamuraiSlashes />}
        {variant === 'tear' && <ScreenTear />}
        {variant === 'punch' && <PunchWall />}
        <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
          <Animated.View style={{ opacity: glow }}>
            <Ionicons
              name={variant === 'slash' ? 'flash' : variant === 'tear' ? 'skull' : 'flash'}
              size={56}
              color={C.ember}
            />
          </Animated.View>
          <Text
            style={{
              color: C.ember,
              fontSize: F.h1,
              fontWeight: '900',
              letterSpacing: 4,
              marginTop: 12,
            }}>
            LEVEL UP
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 96,
              fontWeight: '900',
              textShadowColor: C.red,
              textShadowRadius: 28,
              lineHeight: 110,
            }}>
            {level}
          </Text>
          <Text style={{ color: C.textDim, fontSize: F.h2, fontWeight: '700', letterSpacing: 1 }}>
            {rank.title.toUpperCase()}
          </Text>
          <Btn label="Continue" style={{ marginTop: 28, minWidth: 180 }} onPress={onDone} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
