import { Alert, StyleSheet, View } from 'react-native';
import { Text } from './AppText';

import { reconcileAlarms } from '../alarm/service';
import { applyBackup, exportBackup, pickBackup } from '../backup/files';
import { text } from '../theme';
import { BigButton } from './BigButton';

const fail = (e: unknown) => Alert.alert('Error', e instanceof Error ? e.message : String(e));

export function BackupPanel() {
  const importBackup = async () => {
    const data = await pickBackup();
    if (!data) return;
    Alert.alert(
      'Importar copia',
      `Esto reemplaza TODOS los datos actuales por ${data.pills.length} pastilla(s) de la copia. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reemplazar',
          style: 'destructive',
          onPress: () =>
            applyBackup(data)
              .then(() => reconcileAlarms())
              .then(() => Alert.alert('Listo', 'Copia importada'))
              .catch(fail),
        },
      ]
    );
  };

  return (
    <View style={styles.box}>
      <Text style={text.heading}>Copia de seguridad</Text>
      <Text style={text.small}>Guarda las pastillas y las fotos en un archivo para enviarlo por WhatsApp, correo o Drive.</Text>
      <BigButton title="Exportar copia" onPress={() => exportBackup(true).catch(fail)} outline />
      <BigButton title="Importar copia" onPress={() => importBackup().catch(fail)} outline />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10 },
});
