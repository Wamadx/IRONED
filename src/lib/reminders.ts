import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Plan } from './types';

/**
 * expo-notifications THROWS on import inside Expo Go on Android (removed in SDK 53),
 * so it must never be statically imported — we detect Expo Go first and only
 * lazy-load the module in environments where it works (standalone builds).
 */
const inExpoGo =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

export type ReminderResult = 'off' | 'denied' | 'scheduled' | 'unsupported' | 'failed';

/** Reschedule all weekly workout reminders to match the split schedule. */
export async function syncReminders(
  schedule: (string | null)[],
  plans: Plan[],
  enabled: boolean,
  hour: number
): Promise<ReminderResult> {
  if (Platform.OS === 'web' || inExpoGo) return enabled ? 'unsupported' : 'off';
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return 'off';
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return 'denied';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workouts', {
        name: 'Workout reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    for (let d = 0; d < 7; d++) {
      const v = schedule[d];
      if (!v || v === 'rest') continue;
      const plan = plans.find((p) => p.id === v);
      if (!plan) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚔️ Time to train, Hunter',
          body: `Today’s quest: ${plan.name}`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: d + 1, // expo: 1 = Sunday, matching JS getDay()+1
          hour,
          minute: 0,
        },
      });
    }
    return 'scheduled';
  } catch {
    return 'failed';
  }
}
