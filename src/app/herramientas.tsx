import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notifee, { AndroidNotificationSetting, AuthorizationStatus } from '@notifee/react-native';

import Constants from 'expo-constants';

import AlarmPermissions from '../../modules/alarm-permissions';

import { BackupPanel } from '../components/BackupPanel';
import { BigButton } from '../components/BigButton';
import { TEXT_SIZE_LABELS, type TextSize } from '../domain/textSize';
import { useTextSize } from '../settings/textSize';
import { text } from '../theme';
import { scheduleTestAlarm } from '../alarm/alarm';

type Status = {
  notifications: boolean;
  exactAlarms: boolean;
  batteryOptimised: boolean;
  powerManager: string;
};

export default function Tools() {
  const insets = useSafeAreaInsets();
  const { size, setSize } = useTextSize();
  const [status, setStatus] = useState<Status | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const settings = await notifee.getNotificationSettings();
    const pm = await notifee.getPowerManagerInfo();
    setStatus({
      notifications: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
      exactAlarms: settings.android.alarm === AndroidNotificationSetting.ENABLED,
      batteryOptimised: await notifee.isBatteryOptimizationEnabled(),
      powerManager: pm.activity ? `${pm.manufacturer} (ajuste del fabricante disponible)` : 'sin ajustes especiales',
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const schedule = async (seconds: number) => {
    await notifee.requestPermission();
    await scheduleTestAlarm(Date.now() + seconds * 1000);
    setLog((l) => [`${new Date().toLocaleTimeString()} alarma en ${seconds}s`, ...l]);
    Alert.alert('Alarma programada', `Sonará en ${seconds} segundos. Bloquea el teléfono o cierra la app.`);
    refresh();
  };

  const row = (label: string, ok: boolean) => (
    <Text style={[styles.row, { color: ok ? '#1a7f37' : '#b42318' }]}>
      {ok ? '✔' : '✘'} {label}
    </Text>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={text.heading}>Tamaño del texto</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(Object.keys(TEXT_SIZE_LABELS) as TextSize[]).map((s) => (
          <BigButton key={s} title={TEXT_SIZE_LABELS[s]} onPress={() => setSize(s)} outline={s !== size} compact />
        ))}
      </View>
      <BackupPanel />
      <Text style={styles.title}>Prueba de alarma</Text>
      <Text>
        Versión {Constants.expoConfig?.version} (build {Constants.expoConfig?.android?.versionCode})
      </Text>
      {status && (
        <View>
          {row('Notificaciones permitidas', status.notifications)}
          {row('Alarmas exactas permitidas', status.exactAlarms)}
          {row('Sin optimización de batería', !status.batteryOptimised)}
          <Text style={styles.row}>Fabricante: {status.powerManager}</Text>
        </View>
      )}
      <View style={styles.buttons}>
        <Button title="Pedir permiso de notificaciones" onPress={() => notifee.requestPermission().then(refresh)} />
        <Button title="Permiso de alarmas exactas" onPress={() => notifee.openAlarmPermissionSettings()} />
        <Button title="Permiso de pantalla completa" onPress={() => AlarmPermissions.openFullScreenIntentSettings()} />
        <Button
          title="Permiso 'Aparecer encima'"
          onPress={() => Linking.sendIntent('android.settings.action.MANAGE_OVERLAY_PERMISSION').catch(() => Linking.openSettings())}
        />
        <Button title="Ajustes de notificaciones" onPress={() => notifee.openNotificationSettings()} />
        <Button title="Ajustes de batería" onPress={() => notifee.openBatteryOptimizationSettings()} />
        <Button title="Ajustes del fabricante" onPress={() => notifee.openPowerManagerSettings()} />
        <Button title="Alarma en 20 segundos" onPress={() => schedule(20)} />
        <Button title="Alarma en 1 minuto" onPress={() => schedule(60)} />
        <Button title="Actualizar estado" onPress={refresh} />
      </View>
      {log.map((l, i) => (
        <Text key={i}>{l}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700' },
  row: { fontSize: 18, marginVertical: 2 },
  buttons: { gap: 10, marginVertical: 12 },
});
