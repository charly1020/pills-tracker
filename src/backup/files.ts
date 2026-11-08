import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { listDoses, listPills, replaceAll } from '../db/repository';
import { parseBackup, serializeBackup, type BackupData, type BackupPhotos } from '../domain/backup';
import { deletePhoto, readPhotoBase64, writePhotoFromBase64 } from '../photos/photos';

/** Writes the backup to a file and opens the Android share sheet (WhatsApp, Drive, email...). */
export async function exportBackup(includeHistory: boolean) {
  const pills = await listPills();
  const photos: BackupPhotos = {};
  for (const p of pills) {
    const photo = p.photoUri ? await readPhotoBase64(p.photoUri) : null;
    if (photo) photos[p.id] = photo;
  }
  const data: BackupData = { pills, doses: includeHistory ? await listDoses() : [], photos };
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `pills-tracker-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(serializeBackup(data));
  if (!(await Sharing.isAvailableAsync())) throw new Error('No se puede compartir en este teléfono');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Copia de Pills Tracker' });
}

/** Lets the user pick a backup and parses it. Returns null if they cancel. Does not touch the database. */
export async function pickBackup(): Promise<Required<BackupData> | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled) return null;
  return parseBackup(await new File(res.assets[0].uri).text());
}

/** Replaces all data with the backup, restoring its photos. Old photos are removed only after the database swap succeeds. */
export async function applyBackup(data: Required<BackupData>) {
  const oldPhotos = (await listPills()).map((p) => p.photoUri);
  const newPhotoUris = new Map<number, string>();
  try {
    const pills = data.pills.map((p) => {
      const photo = data.photos[p.id];
      const uri = photo ? writePhotoFromBase64(photo.base64, photo.ext) : null;
      if (uri) newPhotoUris.set(p.id, uri);
      return { ...p, photoUri: uri };
    });
    await replaceAll({ pills, doses: data.doses });
  } catch (e) {
    newPhotoUris.forEach((uri) => deletePhoto(uri));
    throw e;
  }
  oldPhotos.forEach(deletePhoto);
}
