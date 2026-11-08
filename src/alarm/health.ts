import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

import AlarmPermissions from '../../modules/alarm-permissions';
import type { Health, Problem } from './problems';

export async function checkHealth(): Promise<Health> {
  const settings = await notifee.getNotificationSettings();
  return {
    notifications: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
    exactAlarms: settings.android.alarm !== AndroidNotificationSetting.DISABLED,
    fullScreen: AlarmPermissions.canUseFullScreenIntent(),
  };
}

/** Takes the user to the screen where this problem can be fixed. */
export async function fixProblem(problem: Problem) {
  if (problem === 'notifications') {
    const res = await notifee.requestPermission();
    if (res.authorizationStatus !== AuthorizationStatus.AUTHORIZED) await notifee.openNotificationSettings();
  } else if (problem === 'exactAlarms') {
    await notifee.openAlarmPermissionSettings();
  } else {
    AlarmPermissions.openFullScreenIntentSettings();
  }
}
