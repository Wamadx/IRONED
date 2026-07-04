import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import type { MobilityMove } from '@/lib/exercises';
import { getCachedGif } from '@/lib/gif-cache';
import { demoNeedsKey, type GifSource } from '@/lib/gifs';
import { C, F } from '@/lib/theme';

/** Cycles two demo frames so free-exercise-db demos render animated, not static. */
function FrameAnimation({ frames }: { frames: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), 700);
    return () => clearInterval(t);
  }, [frames.length]);
  return (
    <Image
      source={{ uri: frames[idx] }}
      style={{ width: '100%', height: 200, borderRadius: 10, backgroundColor: '#fff' }}
      contentFit="contain"
    />
  );
}

/** High-visibility action chip used inside demo panels (must pop against the card). */
export function ActionChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.redDark,
        borderWidth: 1,
        borderColor: C.red,
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 12,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Ionicons name={icon} size={15} color="#fff" />
      <Text style={{ color: '#fff', fontSize: F.small, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

/** Expandable demo: animated GIF/frames (downloaded once, then local) + mistake warnings. */
export function GifPanel({
  name,
  mistakes = [],
  action,
}: {
  name: string;
  mistakes?: string[];
  /** extra chip rendered beside “Watch example” (e.g. variation cycling) */
  action?: ReactNode;
}) {
  const [source, setSource] = useState<GifSource | null | 'loading'>('loading');

  useEffect(() => {
    let alive = true;
    getCachedGif(name).then((s) => {
      if (alive) setSource(s);
    });
    return () => {
      alive = false;
    };
  }, [name]);

  const router = useRouter();
  const keyMissing = source === null && demoNeedsKey(name);
  return (
    <View style={{ marginTop: 6 }}>
      {source === 'loading' && <ActivityIndicator color={C.red} style={{ marginVertical: 16 }} />}
      {keyMissing && (
        <View>
          <Text style={{ color: C.textDim, fontSize: F.small }}>
            Animated demos need a free ExerciseDB key — add yours once and every demo unlocks
            (step-by-step guide included).
          </Text>
          <View style={{ marginTop: 8 }}>
            <ActionChip
              icon="key"
              label="Add API key in Settings"
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>
      )}
      {source === null && !keyMissing && (
        <Text style={{ color: C.textFaint, fontSize: F.small, fontStyle: 'italic' }}>
          No demo available for this move.
        </Text>
      )}
      {source !== null && source !== 'loading' && source.kind === 'gif' && (
        <Image
          source={{ uri: source.uri, headers: source.headers }}
          style={{ width: '100%', height: 200, borderRadius: 10, backgroundColor: '#fff' }}
          contentFit="contain"
          transition={150}
        />
      )}
      {source !== null && source !== 'loading' && source.kind === 'frames' && (
        <FrameAnimation frames={source.frames} />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <ActionChip
          icon="logo-youtube"
          label="Watch example"
          onPress={() =>
            Linking.openURL(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`
            )
          }
        />
        {action}
      </View>
      {mistakes.length > 0 && (
        <View style={{ marginTop: 8, backgroundColor: C.cardAlt, borderRadius: 10, padding: 10 }}>
          <Text style={{ color: C.ember, fontSize: F.small, fontWeight: '700', marginBottom: 4 }}>
            ⚠ COMMON MISTAKES TO AVOID
          </Text>
          {mistakes.map((mk) => (
            <Text key={mk} style={{ color: C.textDim, fontSize: F.small, marginTop: 2 }}>
              • {mk}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** Chunky tap target for toggling a demo open/closed. */
export function DemoChip({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        backgroundColor: open ? C.redDark : C.cardAlt,
        borderWidth: 1,
        borderColor: open ? C.red : C.border,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Text style={{ color: open ? '#fff' : C.ember, fontSize: F.body, fontWeight: '700' }}>
        {open ? '▼ close' : '▶ demo'}
      </Text>
    </Pressable>
  );
}

/** One warmup/cooldown move with its own demo toggle. */
export function MoveRow({ move }: { move: MobilityMove }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: C.textDim, fontSize: F.body, flex: 1, paddingRight: 8 }}>
          • {move.name} <Text style={{ color: C.textFaint }}>{move.dose}</Text>
        </Text>
        <DemoChip open={open} onPress={() => setOpen((v) => !v)} />
      </View>
      {open && <GifPanel name={move.name} />}
    </View>
  );
}
