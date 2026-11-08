import notifee from '@notifee/react-native';

import { handleAlarmEvent } from './events';

notifee.onBackgroundEvent(handleAlarmEvent);
