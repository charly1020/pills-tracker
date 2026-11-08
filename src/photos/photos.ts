import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const photosDir = () => new Directory(Paths.document, 'photos');
const MAX_WIDTH = 800;

/** Opens the camera or gallery and returns a downsized copy stored in the app's private folder, or null if cancelled. */
export async function pickPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Permite el acceso a la cámara en los ajustes del teléfono');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const res =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled) return null;

  const rendered = await ImageManipulator.manipulate(res.assets[0].uri).resize({ width: MAX_WIDTH }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return await persistPhoto(saved.uri, saved.base64);
}

const describeError = (e: unknown) => (e instanceof Error ? e.message : String(e));
// File.size can read 0 for a file that was just written, so check by reading the bytes back from a fresh handle.
async function bytesOnDisk(uri: string): Promise<number> {
  try {
    const file = new File(uri);
    return file.exists ? (await file.bytes()).length : 0;
  } catch {
    return 0;
  }
}

/**
 * Stores the resized photo in the app's private folder. Tries a plain file copy first and, if that
 * leaves no usable file, writes the image data directly. If both fail the error says what happened.
 */
async function persistPhoto(sourceUri: string, base64?: string): Promise<string> {
  const notes: string[] = [];
  const dir = photosDir();
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch (e) {
    notes.push(`carpeta: ${describeError(e)}`);
  }

  const dest = new File(dir, `${Date.now()}.jpg`);
  const source = new File(sourceUri);
  try {
    source.copy(dest);
  } catch (e) {
    notes.push(`copia: ${describeError(e)}`);
  }

  if ((await bytesOnDisk(dest.uri)) === 0 && base64) {
    try {
      if (dest.exists) dest.delete();
      dest.create({ intermediates: true });
      dest.write(base64, { encoding: 'base64' });
    } catch (e) {
      notes.push(`escritura: ${describeError(e)}`);
    }
  }

  const written = await bytesOnDisk(dest.uri);
  if (written === 0) {
    const detail = [
      ...notes,
      `origen existe=${source.exists} bytes=${await bytesOnDisk(sourceUri)}`,
      `destino existe=${dest.exists} bytes=${written}`,
    ].join('; ');
    throw new Error(`No se pudo guardar la foto en el teléfono (${detail})`);
  }
  return dest.uri;
}

export function deletePhoto(uri: string | null) {
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function readPhotoBase64(uri: string): Promise<{ base64: string; ext: string } | null> {
  const file = new File(uri);
  if (!file.exists) return null;
  return { base64: await file.base64(), ext: uri.split('.').pop() ?? 'jpg' };
}

export function writePhotoFromBase64(base64: string, ext: string): string {
  const dir = photosDir();
  if (!dir.exists) dir.create();
  const dest = new File(dir, `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`);
  dest.create();
  dest.write(base64, { encoding: 'base64' });
  return dest.uri;
}
