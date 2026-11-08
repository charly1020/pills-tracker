import notifee, { EventType, type Event } from '@notifee/react-native';

import { TEST_ID } from './alarm';
import { done, isRealAlarm, snooze } from './service';

/** Handles the Hecho / Posponer buttons on an alarm notification, in the foreground and the background. */
export async function handleAlarmEvent({ type, detail }: Event) {
  if (type !== EventType.ACTION_PRESS) return;
  const { notification, pressAction } = detail;
  if (!notification?.id) return;

  if (notification.id === TEST_ID) {
    await notifee.cancelDisplayedNotification(TEST_ID);
    if (pressAction?.id === 'snooze') {
      const { scheduleTestAlarm } = await import('./alarm');
      await scheduleTestAlarm(Date.now() + 5 * 60_000);
    }
  } else if (isRealAlarm(notification.id)) {
    if (pressAction?.id === 'done') await done(notification);
    else if (pressAction?.id === 'snooze') await snooze(notification);
  }
}
