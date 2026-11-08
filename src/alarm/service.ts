import notifee, { RepeatFrequency, type Notification } from '@notifee/react-native';

import { getPill, insertMissed, listPills, loggedDoseKeys, markTaken } from '../db/repository';
import { dailySlots, GRACE_MS, graceFor, latestOccurrence, overdueDoses, snoozeAt } from '../domain/doseEngine';
import { alarmAndroid, ensureChannel, exactTrigger } from './alarm';

const RING = 'ring-';
const SNOOZE = 'snooze-';
const LOOKBACK_MS = 48 * 60 * 60_000;

export const isRealAlarm = (id?: string) => !!id && (id.startsWith(RING) || id.startsWith(SNOOZE));

/** Next moment (after `now`) with the given clock time. */
function nextOccurrence(minuteOfDay: number, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, minuteOfDay);
  return today > now ? today : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, minuteOfDay);
}

/** Doses that went unanswered for over an hour become "missed" in the log. */
export async function recordMissed(now = new Date()) {
  const pills = await listPills();
  const logged = await loggedDoseKeys(now.getTime() - LOOKBACK_MS);
  await insertMissed(overdueDoses(pills, logged, now, LOOKBACK_MS));
}

/**
 * Makes Android's scheduled alarms match the saved pills: one daily-repeating alarm per clock time.
 * Safe to call at any time; it is the single place that decides what is scheduled.
 */
export async function reconcileAlarms(now = new Date()) {
  await recordMissed(now);
  const pills = await listPills();
  const names = new Map(pills.map((p) => [p.id, p.name]));
  const intervals = new Map(pills.map((p) => [p.id, p.intervalHours]));

  const scheduled = await notifee.getTriggerNotificationIds();
  await Promise.all(scheduled.filter((id) => id.startsWith(RING)).map((id) => notifee.cancelTriggerNotification(id)));

  await ensureChannel();
  for (const slot of dailySlots(pills)) {
    await notifee.createTriggerNotification(
      {
        id: `${RING}${slot.minuteOfDay}`,
        title: 'Hora de tu pastilla',
        body: slot.pillIds.map((id) => names.get(id)).join(', '),
        data: { minute: String(slot.minuteOfDay), pillIds: slot.pillIds.join(',') },
        android: alarmAndroid(Math.min(GRACE_MS, ...slot.pillIds.map((id) => graceFor(intervals.get(id) ?? 24)))),
      },
      exactTrigger(nextOccurrence(slot.minuteOfDay, now).getTime(), RepeatFrequency.DAILY)
    );
  }
}

const slotOf = (n: Notification) => ({
  minute: Number(n.data?.minute),
  pillIds: String(n.data?.pillIds ?? '').split(',').filter(Boolean).map(Number),
});

async function clearSlot(minute: number) {
  await notifee.cancelDisplayedNotifications([`${RING}${minute}`, `${SNOOZE}${minute}`]);
  await notifee.cancelTriggerNotification(`${SNOOZE}${minute}`);
}

/** "Hecho": records every pill of this alarm as taken (stock goes down once) and silences it. */
export async function done(n: Notification, now = new Date()) {
  const { minute, pillIds } = slotOf(n);
  const at = latestOccurrence(minute, now);
  for (const id of pillIds) await markTaken(id, at.getTime(), now.getTime());
  await clearSlot(minute);
}

/** "Posponer": silences this alarm and rings again in 5 minutes, unless that is past the one-hour limit. */
export async function snooze(n: Notification, now = new Date()) {
  const { minute, pillIds } = slotOf(n);
  const at = latestOccurrence(minute, now);
  const pills = (await Promise.all(pillIds.map(getPill))).filter((p) => p !== null);
  const grace = Math.min(GRACE_MS, ...pills.map((p) => graceFor(p.intervalHours)));
  const when = snoozeAt(now, at, grace);
  await clearSlot(minute);
  if (!when) return;
  await ensureChannel();
  await notifee.createTriggerNotification(
    {
      id: `${SNOOZE}${minute}`,
      title: n.title,
      body: n.body,
      data: n.data,
      android: alarmAndroid(at.getTime() + grace - when.getTime()),
    },
    exactTrigger(when.getTime())
  );
}
