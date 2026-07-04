import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { C, F, S } from '@/lib/theme';

/*
 * IMPORTANT: colors and font sizes must be applied inline (render time), never
 * inside the static StyleSheet below — the theme system mutates C and F, and
 * anything captured in StyleSheet.create keeps stale (dark, unscaled) values.
 */

/** wonky per-corner radii when the flavor defines them */
function corners(radii: [number, number, number, number] | null, fallback: number) {
  return radii
    ? {
        borderTopLeftRadius: radii[0],
        borderTopRightRadius: radii[1],
        borderBottomRightRadius: radii[2],
        borderBottomLeftRadius: radii[3],
      }
    : { borderRadius: fallback };
}

interface Notch {
  pos: object;
  size: number;
}

/** each mount invents its own shape — blob corners, uneven ink borders, offset, tilt, bite marks */
function freeformShape(): {
  box: object;
  notches: Notch[];
  chain: 'top' | 'bottom' | null;
  frame: boolean;
} {
  const r = () => Math.round(4 + Math.random() * 34);
  const bw = () => Math.round(2 + Math.random() * 3);
  // 0-2 torn "bites" out of random edges
  const notches: Notch[] = [];
  const bites = Math.floor(Math.random() * 3);
  for (let i = 0; i < bites; i++) {
    const size = Math.round(10 + Math.random() * 8);
    const along = `${Math.round(15 + Math.random() * 60)}%`;
    const edge = Math.floor(Math.random() * 4);
    notches.push({
      size,
      pos:
        edge === 0
          ? { top: -size / 2, left: along }
          : edge === 1
            ? { bottom: -size / 2, left: along }
            : edge === 2
              ? { left: -size / 2, top: along }
              : { right: -size / 2, top: along },
    });
  }
  // extra chaos: some cards get a chain of punched holes, some a crooked sticker frame
  const roll = Math.random();
  const chain: 'top' | 'bottom' | null = roll < 0.22 ? 'top' : roll < 0.36 ? 'bottom' : null;
  const frame = !chain && roll > 0.72;
  return {
    box: {
      borderTopLeftRadius: r(),
      borderTopRightRadius: r(),
      borderBottomRightRadius: r(),
      borderBottomLeftRadius: r(),
      borderLeftWidth: bw(),
      borderTopWidth: bw(),
      borderRightWidth: bw(),
      borderBottomWidth: bw(),
      transform: [
        { rotate: `${((Math.random() * 2 - 1) * S.tiltMax).toFixed(2)}deg` },
        { translateX: Math.round((Math.random() * 2 - 1) * 6) },
      ],
    },
    notches,
    chain,
    frame,
  };
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  // stable random shape per mount — the alien flavor's disorientation
  const free = useRef(S.freeform ? freeformShape() : null).current;
  const tilt = useRef(!S.freeform && S.tiltMax > 0 ? (Math.random() * 2 - 1) * S.tiltMax : 0).current;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: C.card,
          borderColor: S.inkBorders ? C.text : C.border,
          borderWidth: S.borderW,
          ...corners(S.radii, S.radius),
          ...S.shadow,
        },
        free?.box,
        tilt !== 0 && { transform: [{ rotate: `${tilt.toFixed(2)}deg` }] },
        style,
      ]}>
      {free?.frame && (
        // crooked "sticker" frame poking out behind the card
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -7,
            left: -5,
            right: -7,
            bottom: -5,
            borderWidth: 2,
            borderColor: C.redDark,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 26,
            borderBottomRightRadius: 6,
            borderBottomLeftRadius: 22,
            transform: [{ rotate: '1.1deg' }],
          }}
        />
      )}
      {children}
      {free?.notches.map((n, i) => (
        <View
          key={`notch-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: n.size,
            height: n.size,
            backgroundColor: C.bg,
            transform: [{ rotate: '45deg' }],
            ...n.pos,
          }}
        />
      ))}
      {free?.chain && (
        // chain of punched holes along one edge — like the card is bolted on
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            [free.chain]: -7,
            left: 14,
            right: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          {Array.from({ length: 7 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2.5,
                borderColor: C.text,
                backgroundColor: C.bg,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={[styles.title, { color: C.text, fontSize: F.title }]}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  return <Text style={[styles.h2, { color: C.text, fontSize: F.h2 }]}>{children}</Text>;
}

export function Dim({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <Text style={{ color: C.textDim, fontSize: small ? F.small : F.body }}>{children}</Text>
  );
}

type IconName = keyof typeof Ionicons.glyphMap;

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  style?: ViewStyle;
}) {
  const textColor = kind === 'ghost' ? C.text : kind === 'danger' ? C.red : '#fff';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        corners(S.btnRadii, S.btnRadius),
        kind === 'primary' && { backgroundColor: C.red, ...S.shadow },
        kind === 'ghost' && {
          backgroundColor: C.cardAlt,
          borderWidth: S.borderW,
          borderColor: S.inkBorders ? C.text : C.border,
        },
        kind === 'danger' && { backgroundColor: 'transparent', borderWidth: S.borderW, borderColor: C.redDark },
        pressed && { opacity: 0.7 },
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <Ionicons name={icon} size={16} color={textColor} />}
        <Text style={[styles.btnText, { color: textColor, fontSize: F.body }]}>
          {S.upper ? label.toUpperCase() : label}
        </Text>
      </View>
    </Pressable>
  );
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Spotlight overlay for the armed state of two-tap confirms: dims the whole
 * screen so ONLY the confirm control is visible at its original position.
 * Tapping the dimmed area (or waiting 6s) cancels; tapping the control confirms.
 */
function ArmedSpotlight({
  rect,
  onCancel,
  onConfirm,
  children,
}: {
  rect: Rect | null;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const t = setTimeout(onCancel, 6000);
    return () => clearTimeout(t);
  }, [onCancel]);
  return (
    <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)' }} onPress={onCancel}>
        {rect && (
          <Pressable
            onPress={onConfirm}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.w,
              minHeight: rect.h,
            }}>
            {children}
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

/**
 * Two-tap confirm button. First tap arms it: everything else dims and only this
 * button stays visible. Tapping anywhere else resets; tapping it again confirms.
 */
export function ConfirmBtn({
  label,
  confirmLabel = 'Sure? Tap again',
  onConfirm,
  kind = 'danger',
  icon,
  style,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  style?: ViewStyle;
}) {
  const [armed, setArmed] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const ref = useRef<View>(null);

  const textColor = kind === 'ghost' ? C.text : kind === 'danger' ? C.red : '#fff';
  return (
    <View ref={ref} collapsable={false} style={style}>
      <Pressable
        onPress={() =>
          ref.current?.measureInWindow((x, y, w, h) => {
            setRect({ x, y, w, h });
            setArmed(true);
          })
        }
        style={({ pressed }) => [
          styles.btn,
          kind === 'primary' && { backgroundColor: C.red },
          kind === 'ghost' && { backgroundColor: C.cardAlt, borderWidth: 1, borderColor: C.border },
          kind === 'danger' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.redDark },
          pressed && { opacity: 0.8 },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon && <Ionicons name={icon} size={16} color={textColor} />}
          <Text style={[styles.btnText, { color: textColor, fontSize: F.body }]}>{label}</Text>
        </View>
      </Pressable>

      {armed && (
        <ArmedSpotlight
          rect={rect}
          onCancel={() => setArmed(false)}
          onConfirm={() => {
            setArmed(false);
            onConfirm();
          }}>
          <View
            style={[
              styles.btn,
              {
                backgroundColor: C.red,
                borderWidth: 2,
                borderColor: '#fff',
                minHeight: rect?.h,
                justifyContent: 'center',
              },
            ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="warning" size={16} color="#fff" />
              <Text style={[styles.btnText, { color: '#fff', fontSize: F.body }]}>{confirmLabel}</Text>
            </View>
          </View>
        </ArmedSpotlight>
      )}
    </View>
  );
}

/** Small two-tap trash icon with the same spotlight-confirm behavior. */
export function TrashConfirm({ onDelete, size = 16 }: { onDelete: () => void; size?: number }) {
  const [armed, setArmed] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const ref = useRef<View>(null);
  return (
    <View ref={ref} collapsable={false}>
      <Pressable
        hitSlop={10}
        onPress={() =>
          ref.current?.measureInWindow((x, y, w, h) => {
            setRect({ x, y, w, h });
            setArmed(true);
          })
        }>
        <Ionicons name="trash-outline" size={size} color={C.textFaint} />
      </Pressable>

      {armed && (
        <ArmedSpotlight
          rect={
            // grow the spotlight target leftward so "sure? delete" fits
            rect ? { x: rect.x - 96, y: rect.y - 8, w: rect.w + 104, h: rect.h + 16 } : null
          }
          onCancel={() => setArmed(false)}
          onConfirm={() => {
            setArmed(false);
            onDelete();
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 6,
              backgroundColor: C.red,
              borderWidth: 2,
              borderColor: '#fff',
              borderRadius: 10,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}>
            <Text style={{ color: '#fff', fontSize: F.small, fontWeight: '700' }}>
              sure? delete
            </Text>
            <Ionicons name="trash" size={size} color="#fff" />
          </View>
        </ArmedSpotlight>
      )}
    </View>
  );
}

export function NumInput({
  value,
  onChange,
  ...props
}: { value: number; onChange: (n: number) => void } & Omit<
  TextInputProps,
  'value' | 'onChange' | 'onChangeText'
>) {
  return (
    <TextInput
      style={[
        styles.numInput,
        {
          backgroundColor: C.cardAlt,
          borderColor: C.border,
          borderRadius: S.radiusSm,
          borderWidth: S.borderW,
          color: C.text,
          fontSize: F.body,
        },
      ]}
      keyboardType="numeric"
      defaultValue={value ? String(value) : ''}
      placeholder="0"
      placeholderTextColor={C.textFaint}
      selectTextOnFocus
      onChangeText={(t) => {
        const n = parseFloat(t.replace(',', '.'));
        onChange(Number.isFinite(n) ? n : 0);
      }}
      {...props}
    />
  );
}

// layout only — colors/fonts are applied inline (see note at top of file)
const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  h2: { fontWeight: '700' },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '700' },
  numInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 56,
    textAlign: 'center',
  },
});
