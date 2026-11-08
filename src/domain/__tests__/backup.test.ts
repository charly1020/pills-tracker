import { parseBackup, serializeBackup } from '../backup';
import type { DoseLog, Pill } from '../types';

const pill: Pill = {
  id: 1,
  name: 'Metformina',
  reason: 'Diabetes',
  dose: '1 comprimido',
  notes: 'Con comida',
  photoUri: null,
  anchorMinutes: 420,
  intervalHours: 8,
  stockQty: 30,
  unitsPerDose: 1,
  createdAt: 1_760_000_000_000,
};
const dose: DoseLog = { id: 1, pillId: 1, scheduledAt: 1_760_000_100_000, state: 'taken', takenAt: 1_760_000_160_000 };

describe('backup', () => {
  it('round-trips pills and history', () => {
    const text = serializeBackup({ pills: [pill], doses: [dose] }, new Date('2026-10-17T10:00:00Z'));
    expect(parseBackup(text)).toEqual({ pills: [pill], doses: [dose], photos: {} });
  });

  it('can omit history', () => {
    const text = serializeBackup({ pills: [pill], doses: [] });
    expect(parseBackup(text).doses).toEqual([]);
  });

  it('round-trips photos by pill id', () => {
    const photos = { 1: { base64: 'QUJD', ext: 'jpg' } };
    const text = serializeBackup({ pills: [pill], doses: [], photos });
    expect(parseBackup(text).photos).toEqual(photos);
  });

  it('has no photos when none were exported', () => {
    expect(parseBackup(serializeBackup({ pills: [pill], doses: [] })).photos).toEqual({});
  });

  it('rejects photos for pills that are not in the file', () => {
    const text = serializeBackup({ pills: [pill], doses: [], photos: { 99: { base64: 'QUJD', ext: 'jpg' } } });
    expect(() => parseBackup(text)).toThrow('inválida');
  });

  it('accepts a pill whose dose is text (units 0)', () => {
    const textPill = { ...pill, dose: 'media', unitsPerDose: 0 };
    expect(parseBackup(serializeBackup({ pills: [textPill], doses: [] })).pills).toEqual([textPill]);
  });

  it('rejects text that is not JSON', () => {
    expect(() => parseBackup('hola')).toThrow('no es una copia');
  });

  it('rejects JSON from another app', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', version: 1, pills: [] }))).toThrow('no es una copia');
  });

  it('rejects a newer format version', () => {
    const text = serializeBackup({ pills: [], doses: [] });
    const newer = JSON.stringify({ ...JSON.parse(text), version: 99 });
    expect(() => parseBackup(newer)).toThrow('versión más nueva');
  });

  it('rejects pills with an invalid interval or missing name', () => {
    const bad = (p: object) => JSON.stringify({ app: 'pills-tracker', version: 1, pills: [p], doses: [] });
    expect(() => parseBackup(bad({ ...pill, intervalHours: 0 }))).toThrow('inválida');
    expect(() => parseBackup(bad({ ...pill, name: '' }))).toThrow('inválida');
    expect(() => parseBackup(bad({ ...pill, anchorMinutes: 2000 }))).toThrow('inválida');
  });

  it('rejects doses pointing at a pill that is not in the file', () => {
    const text = serializeBackup({ pills: [pill], doses: [{ ...dose, pillId: 99 }] });
    expect(() => parseBackup(text)).toThrow('inválida');
  });
});
