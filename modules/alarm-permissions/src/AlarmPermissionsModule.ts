import { NativeModule, requireNativeModule } from 'expo';

declare class AlarmPermissionsModule extends NativeModule<{}> {
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): void;
  createAlarmChannel(id: string, name: string): void;
}

export default requireNativeModule<AlarmPermissionsModule>('AlarmPermissions');
