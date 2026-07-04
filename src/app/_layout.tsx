import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useApp } from '@/lib/store';
import { applyFontScale, applyTheme, applyUiFlavor, BACKGROUNDS, C } from '@/lib/theme';

export default function RootLayout() {
  const accent = useApp((s) => s.accent);
  const bgTheme = useApp((s) => s.bgTheme);
  const fontScale = useApp((s) => s.fontScale);
  const uiFlavor = useApp((s) => s.uiFlavor);
  const pageAnimations = useApp((s) => s.pageAnimations);
  // mutate the shared palette before children render; key below remounts on change
  applyTheme(bgTheme, accent);
  applyFontScale(fontScale);
  applyUiFlavor(uiFlavor);

  const navTheme = {
    ...DarkTheme,
    dark: bgTheme === 'dark',
    colors: {
      ...DarkTheme.colors,
      background: C.bg,
      card: C.card,
      text: C.text,
      border: C.border,
      primary: C.red,
      notification: C.red,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} key={`${bgTheme}-${accent}-${fontScale}-${uiFlavor}`}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={BACKGROUNDS[bgTheme].statusBar} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.bg },
            headerTintColor: C.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: C.bg },
            animation: pageAnimations ? 'slide_from_right' : 'none',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="plan/[id]" options={{ title: 'Edit Plan' }} />
          <Stack.Screen name="workout/active" options={{ title: 'Workout', headerBackVisible: false }} />
          <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
          <Stack.Screen
            name="exercise-picker"
            options={{ title: 'Add Exercises', presentation: 'modal' }}
          />
          <Stack.Screen name="meal-add" options={{ title: 'Log a Meal' }} />
          <Stack.Screen name="meal/[id]" options={{ title: 'Meal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="measurements" options={{ title: 'Body Measurements' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
