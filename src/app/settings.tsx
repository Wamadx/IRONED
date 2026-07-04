import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, ConfirmBtn, Dim, H2, NumInput } from '@/components/ui';
import { checkForUpdate } from '@/lib/app-updates';
import { exportBackup, importBackup } from '@/lib/backup';
import { APP_VERSION } from '@/lib/config';
import { syncReminders } from '@/lib/reminders';
import { cycleIndexForDate } from '@/lib/schedule';
import { useApp } from '@/lib/store';
import {
  ACCENTS,
  BACKGROUNDS,
  C,
  F,
  FONT_SCALES,
  type AccentId,
  type BgId,
  type FontScaleId,
  type UiFlavor,
} from '@/lib/theme';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function KeyGuide({ title, steps, url }: { title: string; steps: string[]; url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 4 }}>
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={6}>
        <Text style={{ color: C.ember, fontSize: F.small, fontWeight: '600' }}>
          {open ? '▼' : '▶'} How to get one
        </Text>
      </Pressable>
      {open && (
        <View style={{ marginTop: 4 }}>
          {steps.map((s, i) => (
            <Dim key={i} small>
              {i + 1}. {s}
            </Dim>
          ))}
          <Pressable onPress={() => Linking.openURL(url)} hitSlop={6}>
            <Text style={{ color: C.red, fontSize: F.small, fontWeight: '600', marginTop: 4 }}>
              Open {title} ↗
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const unit = useApp((s) => s.unit);
  const setUnit = useApp((s) => s.setUnit);
  const barWeight = useApp((s) => s.barWeight);
  const setBarWeight = useApp((s) => s.setBarWeight);
  const apiKeys = useApp((s) => s.apiKeys);
  const setApiKey = useApp((s) => s.setApiKey);
  const plans = useApp((s) => s.plans);
  const schedule = useApp((s) => s.schedule);
  const setScheduleDay = useApp((s) => s.setScheduleDay);
  const scheduleMode = useApp((s) => s.scheduleMode);
  const setScheduleMode = useApp((s) => s.setScheduleMode);
  const cycle = useApp((s) => s.cycle);
  const setCycle = useApp((s) => s.setCycle);
  const cycleStart = useApp((s) => s.cycleStart);
  const restartCycleToday = useApp((s) => s.restartCycleToday);
  const remindersEnabled = useApp((s) => s.remindersEnabled);
  const reminderHour = useApp((s) => s.reminderHour);
  const setReminders = useApp((s) => s.setReminders);
  const waterGoal = useApp((s) => s.waterGoal);
  const setWaterGoal = useApp((s) => s.setWaterGoal);
  const accent = useApp((s) => s.accent);
  const setAccent = useApp((s) => s.setAccent);
  const bgTheme = useApp((s) => s.bgTheme);
  const setBgTheme = useApp((s) => s.setBgTheme);
  const fontScale = useApp((s) => s.fontScale);
  const setFontScale = useApp((s) => s.setFontScale);
  const uiFlavor = useApp((s) => s.uiFlavor);
  const setUiFlavor = useApp((s) => s.setUiFlavor);
  const pageAnimations = useApp((s) => s.pageAnimations);
  const setPageAnimations = useApp((s) => s.setPageAnimations);
  const greeting = useApp((s) => s.greeting);
  const setGreeting = useApp((s) => s.setGreeting);
  const resetAll = useApp((s) => s.resetAll);
  const [dataMsg, setDataMsg] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  const [openDay, setOpenDay] = useState<number | null>(null);
  const [reminderMsg, setReminderMsg] = useState('');

  const scheduleLabel = (v: string | null) => {
    if (v === 'rest') return 'Rest';
    if (!v) return '—';
    return plans.find((p) => p.id === v)?.name ?? '—';
  };

  const applyReminders = async (enabled: boolean, hour: number) => {
    setReminders(enabled, hour);
    if (scheduleMode === 'cycle' && enabled) {
      setReminderMsg('Reminders currently support the weekly schedule only — cycle mode has no fixed weekday to pin them to.');
      return;
    }
    const r = await syncReminders(schedule, plans, enabled, hour);
    setReminderMsg(
      r === 'scheduled'
        ? `Reminders set for scheduled days at ${hour}:00.`
        : r === 'off'
          ? 'Reminders off.'
          : r === 'denied'
            ? 'Notification permission denied — enable it in Android settings.'
            : r === 'unsupported'
              ? 'Saved — but Expo Go can’t deliver notifications. They’ll work in the standalone APK build.'
              : 'Could not schedule reminders.'
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled">
      <Card>
        <H2>Units</H2>
        <Dim small>
          Labels and the plate calculator only — numbers you already logged are not converted.
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(['kg', 'lb'] as const).map((u) => (
            <Btn
              key={u}
              label={u.toUpperCase()}
              kind={unit === u ? 'primary' : 'ghost'}
              style={{ flex: 1 }}
              onPress={() => setUnit(u)}
            />
          ))}
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <Dim>Bar weight ({unit})</Dim>
          <NumInput value={barWeight} onChange={(n) => setBarWeight(n)} />
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <Dim>Water goal (ml)</Dim>
          <NumInput value={waterGoal} onChange={(n) => setWaterGoal(n)} />
        </View>
      </Card>

      <Card>
        <H2>Personalize</H2>
        <Dim small>Home screen greeting</Dim>
        <TextInput
          defaultValue={greeting}
          onEndEditing={(e) => setGreeting(e.nativeEvent.text)}
          placeholder="ARISE, HUNTER"
          placeholderTextColor={C.textFaint}
          style={{
            backgroundColor: C.cardAlt,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            color: C.text,
            padding: 10,
            marginTop: 6,
          }}
        />
        <Dim small>
          {'\n'}Background
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(Object.keys(BACKGROUNDS) as BgId[]).map((id) => (
            <Pressable
              key={id}
              onPress={() => setBgTheme(id)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: BACKGROUNDS[id].card,
                borderWidth: bgTheme === id ? 2 : 1,
                borderColor: bgTheme === id ? C.red : C.border,
              }}>
              <Text style={{ color: BACKGROUNDS[id].text, fontWeight: '700', fontSize: F.small }}>
                {id}
              </Text>
            </Pressable>
          ))}
        </View>
        <Dim small>
          {'\n'}Font size
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(Object.keys(FONT_SCALES) as FontScaleId[]).map((id) => (
            <Btn
              key={id}
              label={id}
              kind={fontScale === id ? 'primary' : 'ghost'}
              style={{ flex: 1, paddingHorizontal: 4 }}
              onPress={() => setFontScale(id)}
            />
          ))}
        </View>
        <Dim small>
          {'\n'}UI style
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(['modern', 'boxy', 'alien'] as UiFlavor[]).map((id) => (
            <Btn
              key={id}
              label={id === 'boxy' ? 'Boxy' : id === 'alien' ? 'Alien' : 'Modern'}
              kind={uiFlavor === id ? 'primary' : 'ghost'}
              style={{ flex: 1 }}
              onPress={() => setUiFlavor(id)}
            />
          ))}
        </View>
        <Dim small>
          Boxy: early-2000s web — square corners, hard shadows, SHOUTY buttons. Alien: flash-site
          chaos — thick cartoon outlines, lopsided corners, tilted cards.
        </Dim>
        <Dim small>
          {'\n'}Page transitions
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Btn
            label={pageAnimations ? 'Animations on' : 'Animations off'}
            icon={pageAnimations ? 'play' : 'pause'}
            kind={pageAnimations ? 'primary' : 'ghost'}
            style={{ flex: 1 }}
            onPress={() => setPageAnimations(!pageAnimations)}
          />
        </View>
        <Dim small>
          {'\n'}Accent color
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
            <Pressable
              key={id}
              onPress={() => setAccent(id)}
              hitSlop={6}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: ACCENTS[id].red,
                borderWidth: accent === id ? 3 : 1,
                borderColor: accent === id ? C.text : C.border,
              }}
            />
          ))}
        </View>
      </Card>

      <Card>
        <H2>Training schedule</H2>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {(['weekly', 'cycle'] as const).map((m) => (
            <Btn
              key={m}
              label={m === 'weekly' ? 'Weekly' : 'Rotating cycle'}
              kind={scheduleMode === m ? 'primary' : 'ghost'}
              style={{ flex: 1 }}
              onPress={() => setScheduleMode(m)}
            />
          ))}
        </View>
        <Dim small>
          {scheduleMode === 'weekly'
            ? '\nAssign a plan or a rest day to each weekday. Scheduled rest days keep your streak alive.'
            : '\nA repeating sequence independent of weekdays — e.g. Upper A → Lower A → Upper B → Lower B → Rest, then back to day 1. Rest days keep your streak alive.'}
        </Dim>
        {scheduleMode === 'cycle' && (
          <>
            {cycle.map((slot, d) => (
              <View key={d} style={{ marginTop: 8 }}>
                <Pressable
                  onPress={() => setOpenDay((cur) => (cur === d ? null : d))}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: C.cardAlt,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: openDay === d ? C.red : C.border,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                  }}>
                  <Text style={{ color: C.text, fontWeight: '600', fontSize: F.body }}>
                    Day {d + 1}
                    {cycleIndexForDate(cycle, cycleStart, Date.now()) === d ? '  ← today' : ''}
                  </Text>
                  <Text
                    style={{
                      color: slot === 'rest' ? C.ember : C.red,
                      fontSize: F.body,
                    }}>
                    {scheduleLabel(slot)} {openDay === d ? '▲' : '▼'}
                  </Text>
                </Pressable>
                {openDay === d && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {[
                      { v: 'rest', label: 'Rest day' },
                      ...plans.map((p) => ({ v: p.id, label: p.name })),
                      { v: '__remove', label: '✕ remove day' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.label}
                        onPress={() => {
                          if (opt.v === '__remove') {
                            setCycle(cycle.filter((_, i) => i !== d));
                          } else {
                            setCycle(cycle.map((v, i) => (i === d ? opt.v : v)));
                          }
                          setOpenDay(null);
                        }}
                        style={{
                          backgroundColor: cycle[d] === opt.v ? C.red : C.card,
                          borderWidth: 1,
                          borderColor: cycle[d] === opt.v ? C.red : C.border,
                          borderRadius: 14,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                        }}>
                        <Text
                          style={{
                            color: cycle[d] === opt.v ? '#fff' : C.textDim,
                            fontSize: F.small,
                          }}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <Btn
              label="+ Add cycle day"
              kind="ghost"
              style={{ marginTop: 10 }}
              onPress={() => setCycle([...cycle, 'rest'])}
            />
            <Btn
              label="Restart cycle from today (today = Day 1)"
              kind="ghost"
              style={{ marginTop: 8 }}
              onPress={restartCycleToday}
            />
          </>
        )}
        {scheduleMode === 'weekly' &&
          DAY_NAMES.map((name, d) => (
          <View key={name} style={{ marginTop: 8 }}>
            <Pressable
              onPress={() => setOpenDay((cur) => (cur === d ? null : d))}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: C.cardAlt,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: openDay === d ? C.red : C.border,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}>
              <Text style={{ color: C.text, fontWeight: '600', fontSize: F.body }}>{name}</Text>
              <Text
                style={{
                  color: schedule[d] === 'rest' ? C.ember : schedule[d] ? C.red : C.textFaint,
                  fontSize: F.body,
                }}>
                {scheduleLabel(schedule[d])} {openDay === d ? '▲' : '▼'}
              </Text>
            </Pressable>
            {openDay === d && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {[
                  { v: null, label: '— none' },
                  { v: 'rest' as string | null, label: 'Rest day' },
                  ...plans.map((p) => ({ v: p.id as string | null, label: p.name })),
                ].map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => {
                      setScheduleDay(d, opt.v);
                      setOpenDay(null);
                    }}
                    style={{
                      backgroundColor: schedule[d] === opt.v ? C.red : C.card,
                      borderWidth: 1,
                      borderColor: schedule[d] === opt.v ? C.red : C.border,
                      borderRadius: 14,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}>
                    <Text
                      style={{
                        color: schedule[d] === opt.v ? '#fff' : C.textDim,
                        fontSize: F.small,
                      }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </Card>

      <Card>
        <H2>Workout reminders</H2>
        <Dim small>
          A notification on scheduled training days. Can be unreliable inside Expo Go; works
          properly in the standalone app.
        </Dim>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' }}>
          <Btn
            label={remindersEnabled ? 'On' : 'Off'}
            kind={remindersEnabled ? 'primary' : 'ghost'}
            style={{ flex: 1 }}
            onPress={() => applyReminders(!remindersEnabled, reminderHour)}
          />
          <Dim>at</Dim>
          <NumInput
            value={reminderHour}
            onChange={(n) => applyReminders(remindersEnabled, n)}
          />
          <Dim>:00</Dim>
        </View>
        {reminderMsg !== '' && <Dim small>{reminderMsg}</Dim>}
      </Card>

      <Card>
        <H2>API keys</H2>
        <Dim small>
          Optional — the app ships with the developer’s keys for now. Paste your own to use your
          quotas instead (needed if you got this app from someone else).
        </Dim>

        <Text style={{ color: C.text, fontWeight: '700', fontSize: F.body, marginTop: 12 }}>
          Gemini (meal photo analysis)
        </Text>
        <KeyGuide
          title="Google AI Studio"
          url="https://aistudio.google.com/apikey"
          steps={[
            'Sign in with any Google account',
            'Click “Create API key”',
            'Copy the key and paste it below — the free tier is plenty',
          ]}
        />
        <TextInput
          defaultValue={apiKeys.gemini}
          onEndEditing={(e) => setApiKey('gemini', e.nativeEvent.text)}
          placeholder="Paste Gemini API key (optional)"
          placeholderTextColor={C.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: C.cardAlt,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            color: C.text,
            padding: 10,
            marginTop: 8,
            fontSize: F.small,
          }}
        />

        <Text style={{ color: C.text, fontWeight: '700', fontSize: F.body, marginTop: 16 }}>
          ExerciseDB (exercise demo GIFs)
        </Text>
        <KeyGuide
          title="RapidAPI — ExerciseDB"
          url="https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb"
          steps={[
            'Create a free RapidAPI account',
            'Subscribe to ExerciseDB’s free Basic plan',
            'Copy your X-RapidAPI-Key from the endpoint page and paste it below',
          ]}
        />
        <TextInput
          defaultValue={apiKeys.exercisedb}
          onEndEditing={(e) => setApiKey('exercisedb', e.nativeEvent.text)}
          placeholder="Paste ExerciseDB API key (optional)"
          placeholderTextColor={C.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: C.cardAlt,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            color: C.text,
            padding: 10,
            marginTop: 8,
            fontSize: F.small,
          }}
        />
      </Card>

      <Card>
        <H2>Data</H2>
        <Dim small>
          No account = no cloud backup. Export regularly and stash the file somewhere safe — photos
          are included.
        </Dim>
        <Btn
          label="Export backup (JSON)"
          icon="download-outline"
          kind="ghost"
          style={{ marginTop: 10 }}
          onPress={async () => {
            const r = await exportBackup();
            setDataMsg(
              r === 'saved'
                ? 'Backup saved to the folder you picked (e.g. Downloads).'
                : r === 'shared'
                  ? 'Backup exported via share sheet.'
                  : r === 'unavailable'
                    ? 'Sharing not available on this device.'
                    : 'Export failed or cancelled.'
            );
          }}
        />
        <ConfirmBtn
          label="Import backup — replaces current data"
          confirmLabel="Tap again to pick a backup file"
          icon="cloud-upload-outline"
          kind="ghost"
          style={{ marginTop: 10 }}
          onConfirm={async () => {
            const r = await importBackup();
            setDataMsg(
              r.status === 'imported'
                ? 'Backup imported (photos included).'
                : r.status === 'cancelled'
                  ? 'Import cancelled.'
                  : r.status === 'unreadable'
                    ? `Could not read that file. Error: ${r.detail ?? 'unknown'}`
                    : r.status === 'not-json'
                      ? 'That file isn’t JSON — pick the exported hevyclone-backup file.'
                      : 'JSON, but not a backup from this app.'
            );
          }}
        />
        {dataMsg !== '' && <Dim small>{dataMsg}</Dim>}
      </Card>

      <Card>
        <H2>About & updates</H2>
        <Dim small>Version {APP_VERSION}</Dim>
        <Btn
          label="Check for updates"
          icon="refresh-outline"
          kind="ghost"
          style={{ marginTop: 10 }}
          onPress={async () => {
            setUpdateMsg('Checking…');
            setUpdateUrl(null);
            const r = await checkForUpdate();
            if (r.status === 'update') {
              setUpdateMsg(`Update available: ${r.latest} (you have ${APP_VERSION}).`);
              setUpdateUrl(r.url ?? null);
            } else if (r.status === 'latest') {
              setUpdateMsg(`You're on the latest version (${APP_VERSION}).`);
            } else if (r.status === 'unconfigured') {
              setUpdateMsg('Update checking not configured yet (GITHUB_REPO in src/lib/config.ts).');
            } else {
              setUpdateMsg('Could not reach the update server — check your connection.');
            }
          }}
        />
        {updateUrl && (
          <Btn
            label="Open download page"
            icon="open-outline"
            style={{ marginTop: 8 }}
            onPress={() => Linking.openURL(updateUrl)}
          />
        )}
        {updateMsg !== '' && <Dim small>{updateMsg}</Dim>}
      </Card>

      <Card style={{ borderColor: C.redDark }}>
        <H2>Danger zone</H2>
        <Dim small>
          Wipes everything — plans, workouts, XP, meals, photos, cached demos — back to a fresh
          install. You’ll see onboarding again.
        </Dim>
        <ConfirmBtn
          label="Reset all app data"
          confirmLabel="Tap again — everything will be erased"
          style={{ marginTop: 10 }}
          onConfirm={() => {
            resetAll();
            if (Platform.OS !== 'web') {
              for (const dir of ['gif-cache/', 'meal-photos/', 'body-photos/']) {
                FileSystem.deleteAsync(`${FileSystem.documentDirectory}${dir}`, {
                  idempotent: true,
                }).catch(() => {});
              }
            }
          }}
        />
      </Card>
    </ScrollView>
  );
}
