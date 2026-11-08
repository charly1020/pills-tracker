import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import AlarmPermissions from '../../modules/alarm-permissions';

// New id (not 'alarm'): Android never changes the sound of an existing channel, and the old one used the notification volume.
export const CHANNEL_ID = 'alarm_v2';
const OLD_CHANNEL_ID = 'alarm';
export const TEST_ID = 'spike-test';

/** Creates the alarm channel (alarm volume, ignores vibrate mode) and removes the old notification-volume one. */
export async function ensureChannel() {
  AlarmPermissions.createAlarmChannel(CHANNEL_ID, 'Alarma de pastillas');
  await notifee.deleteChannel(OLD_CHANNEL_ID).catch(() => {});
}

/** Android notification settings shared by every alarm: full-screen over the lock screen, looping sound, two actions. */
export function alarmAndroid(timeoutAfterMs: number) {
  return {
    channelId: CHANNEL_ID,
    category: AndroidCategory.ALARM,
    visibility: AndroidVisibility.PUBLIC,
    importance: AndroidImportance.HIGH,
    ongoing: true,
    autoCancel: false,
    loopSound: true,
    timeoutAfter: timeoutAfterMs,
    pressAction: { id: 'default', launchActivity: 'default' },
    fullScreenAction: { id: 'default', launchActivity: 'default' },
    actions: [
      { title: 'Posponer 5 min', pressAction: { id: 'snooze' } },
      { title: 'Hecho', pressAction: { id: 'done' } },
    ],
  };
}

export const exactTrigger = (timestamp: number, repeatFrequency?: number): TimestampTrigger => ({
  type: TriggerType.TIMESTAMP,
  timestamp,
  alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
  ...(repeatFrequency !== undefined ? { repeatFrequency } : {}),
});

/** One-off alarm from the Herramientas screen, independent of the saved pills. */
export async function scheduleTestAlarm(atMs: number) {
  await ensureChannel();
  await notifee.createTriggerNotification(
    { id: TEST_ID, title: 'Hora de tu pastilla', body: 'Prueba de alarma', android: alarmAndroid(60 * 60_000) },
    exactTrigger(atMs)
  );
}
