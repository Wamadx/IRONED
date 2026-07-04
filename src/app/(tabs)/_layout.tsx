import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/lib/store';
import { C, F, S } from '@/lib/theme';

/** tab button with the huge default ripple replaced by a tight icon-hugging one */
function TabButton(props: any) {
  return (
    <Pressable
      {...props}
      android_ripple={{ color: `${C.red}26`, radius: 26, borderless: true, foreground: true }}
    />
  );
}

/** default icon: glyph-shaped glow behind the icon when focused, and it grows */
function GlyphIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: import('react-native').ColorValue;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: focused ? 1.28 : 1 }],
      }}>
      {focused && (
        // same glyph, ~15% larger, low opacity — a glow that follows the icon's own shape
        <Ionicons name={name} size={26} color={C.red} style={{ position: 'absolute', opacity: 0.3 }} />
      )}
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

const TAB_ORDER = ['/', '/plans', '/meals', '/hunter', '/history'];

type ShapeKind = 'circle' | 'star' | 'cloud' | 'diamond' | 'torn';

/**
 * Alien flavor: every tab lives in its own shape — circle, 8-point star,
 * cloud bubble with a sharp corner, diamond, torn box. Persona-style: nothing lines up.
 */
function ShapeIcon({
  kind,
  name,
  color,
  focused,
}: {
  kind: ShapeKind;
  name: keyof typeof Ionicons.glyphMap;
  color: import('react-native').ColorValue;
  focused: boolean;
}) {
  if (!S.freeform) return <GlyphIcon name={name} color={color} focused={focused} />;
  const border = focused ? C.red : C.text;
  const icon = <Ionicons name={name} size={17} color={color} />;
  const tilts: Record<ShapeKind, string> = {
    circle: '-4deg',
    star: '8deg',
    cloud: '-6deg',
    diamond: '0deg',
    torn: '5deg',
  };
  const base = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: C.cardAlt,
    borderColor: border,
  };
  let shape;
  if (kind === 'circle') {
    shape = <View style={[base, { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5 }]}>{icon}</View>;
  } else if (kind === 'star') {
    // two rotated squares = 8-point star
    shape = (
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[base, { position: 'absolute', width: 28, height: 28, borderWidth: 2.5, borderRadius: 4 }]}
        />
        <View
          style={[
            base,
            {
              position: 'absolute',
              width: 28,
              height: 28,
              borderWidth: 2.5,
              borderRadius: 4,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        {icon}
      </View>
    );
  } else if (kind === 'cloud') {
    // lumpy bubble with one deliberately sharp corner
    shape = (
      <View style={{ width: 44, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[
            base,
            {
              width: 40,
              height: 30,
              borderWidth: 2.5,
              borderTopLeftRadius: 15,
              borderTopRightRadius: 18,
              borderBottomRightRadius: 2,
              borderBottomLeftRadius: 14,
            },
          ]}>
          {icon}
        </View>
        <View
          style={[
            base,
            { position: 'absolute', top: -2, left: 4, width: 13, height: 13, borderRadius: 7, borderWidth: 2.5 },
          ]}
        />
        <View
          style={[
            base,
            { position: 'absolute', top: -4, right: 9, width: 10, height: 10, borderRadius: 5, borderWidth: 2.5 },
          ]}
        />
      </View>
    );
  } else if (kind === 'diamond') {
    shape = (
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[
            base,
            {
              position: 'absolute',
              width: 27,
              height: 27,
              borderWidth: 2.5,
              borderRadius: 5,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
        {icon}
      </View>
    );
  } else {
    // torn box: jagged corners via bg-colored bite marks
    shape = (
      <View
        style={[
          base,
          {
            width: 40,
            height: 34,
            borderWidth: 2.5,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 3,
            borderBottomLeftRadius: 14,
          },
        ]}>
        {icon}
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: 6,
            width: 10,
            height: 10,
            backgroundColor: C.bg,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -6,
            left: 8,
            width: 9,
            height: 9,
            backgroundColor: C.bg,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }
  return (
    <View style={{ transform: [{ rotate: tilts[kind] }, { scale: focused ? 1.22 : 1 }] }}>
      {shape}
    </View>
  );
}

export default function TabLayout() {
  // dynamic bottom inset: phones with nav buttons get extra clearance, gesture-nav phones don't
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const pageAnimations = useApp((s) => s.pageAnimations);
  const idx = TAB_ORDER.indexOf(pathname);

  // swipe left/right anywhere in a tab to move between tabs
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onStart(() => {
      if (idx >= 0 && idx < TAB_ORDER.length - 1) router.replace(TAB_ORDER[idx + 1] as never);
    });
  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .runOnJS(true)
    .onStart(() => {
      if (idx > 0) router.replace(TAB_ORDER[idx - 1] as never);
    });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(flingLeft, flingRight)}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            animation: pageAnimations ? 'shift' : 'none',
            tabBarButton: TabButton,
            tabBarStyle: S.freeform
              ? {
                  // alien: fully transparent, absolute — the shapes float over the content
                  position: 'absolute' as const,
                  backgroundColor: 'transparent',
                  borderTopWidth: 0,
                  elevation: 0,
                  height: 70 + insets.bottom,
                  paddingBottom: Math.max(insets.bottom, 6),
                  paddingTop: 8,
                }
              : {
                  backgroundColor: C.card,
                  borderTopColor: C.border,
                  height: 56 + insets.bottom,
                  paddingBottom: Math.max(insets.bottom, 6),
                  paddingTop: 6,
                },
            tabBarLabelStyle: { fontSize: F.small - 2, fontWeight: '700' },
            tabBarActiveTintColor: C.red,
            tabBarInactiveTintColor: S.freeform ? C.textDim : C.textFaint,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <ShapeIcon kind="circle" name="flame" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="plans"
            options={{
              title: 'Plans',
              tabBarIcon: ({ color, focused }) => (
                <ShapeIcon kind="star" name="barbell" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="meals"
            options={{
              title: 'Meals',
              tabBarIcon: ({ color, focused }) => (
                <ShapeIcon kind="cloud" name="restaurant" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="hunter"
            options={{
              title: 'Hunter',
              tabBarIcon: ({ color, focused }) => (
                <ShapeIcon kind="diamond" name="flash" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'History',
              tabBarIcon: ({ color, focused }) => (
                <ShapeIcon kind="torn" name="time" color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </GestureDetector>
  );
}
