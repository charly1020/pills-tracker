import { validatePillForm, type PillFormInput } from '../pillForm';

const valid: PillFormInput = {
  name: ' Metformina ', reason: 'Diabetes', notes: '',
  hour: 7, minute: 30, intervalMinutes: 480, stockQty: '30', dose: '1', photoUri: null,
};

describe('validatePillForm', () => {
  it('builds a draft, trimming text and turning empty optionals into null', () => {
    const res = validatePillForm(valid);
    expect(res).toEqual({
      ok: true,
      draft: {
        name: 'Metformina', reason: 'Diabetes', dose: '1', notes: null, photoUri: null,
        anchorMinutes: 7 * 60 + 30, intervalHours: 8, stockQty: 30, unitsPerDose: 1,
      },
    });
  });

  it('stores the interval as hours, so minutes become a fraction of an hour', () => {
    const res = validatePillForm({ ...valid, intervalMinutes: 30 });
    expect(res.ok && res.draft.intervalHours).toBe(0.5);
    const odd = validatePillForm({ ...valid, intervalMinutes: 90 });
    expect(odd.ok && odd.draft.intervalHours).toBe(1.5);
  });

  it('requires a name', () => {
    expect(validatePillForm({ ...valid, name: '  ' })).toEqual({ ok: false, errors: { name: 'Escribe el nombre' } });
  });

  it('treats an empty stock as unknown', () => {
    const res = validatePillForm({ ...valid, stockQty: '' });
    expect(res.ok && res.draft.stockQty).toBeNull();
  });

  it('rejects a non-numeric or negative stock', () => {
    expect(validatePillForm({ ...valid, stockQty: 'abc' }).ok).toBe(false);
    expect(validatePillForm({ ...valid, stockQty: '-1' }).ok).toBe(false);
  });

  it('a whole number dose also sets how much stock each intake uses', () => {
    const res = validatePillForm({ ...valid, dose: '2' });
    expect(res.ok && [res.draft.dose, res.draft.unitsPerDose]).toEqual(['2', 2]);
  });

  it('a text dose is kept as typed and uses no stock (units 0)', () => {
    const res = validatePillForm({ ...valid, dose: '  media  ' });
    expect(res.ok && [res.draft.dose, res.draft.unitsPerDose]).toEqual(['media', 0]);
  });

  it('treats fractions and mixed text as text, not as a number to subtract', () => {
    for (const dose of ['1.5', '1/2', '5 ml', '2 pastillas']) {
      const res = validatePillForm({ ...valid, dose });
      expect(res.ok && res.draft.unitsPerDose).toBe(0);
    }
  });

  it('requires a dose, and rejects zero', () => {
    expect(validatePillForm({ ...valid, dose: '  ' })).toEqual({ ok: false, errors: { dose: 'Escribe la dosis' } });
    expect(validatePillForm({ ...valid, dose: '0' }).ok).toBe(false);
  });

  it('rejects an interval under 5 minutes or over 24 hours', () => {
    expect(validatePillForm({ ...valid, intervalMinutes: 4 }).ok).toBe(false);
    expect(validatePillForm({ ...valid, intervalMinutes: 1441 }).ok).toBe(false);
    expect(validatePillForm({ ...valid, intervalMinutes: 5 }).ok).toBe(false); // 288 alarms a day: see below
    expect(validatePillForm({ ...valid, intervalMinutes: 15 }).ok).toBe(true);
    expect(validatePillForm({ ...valid, intervalMinutes: 1440 }).ok).toBe(true);
  });

  it('rejects an interval that would need too many alarms a day', () => {
    const res = validatePillForm({ ...valid, intervalMinutes: 10 });
    expect(!res.ok && res.errors.interval).toMatch(/demasiadas alarmas/i);
  });

  it('reports every error at once', () => {
    const res = validatePillForm({ ...valid, name: '', dose: '' });
    expect(!res.ok && Object.keys(res.errors).sort()).toEqual(['dose', 'name']);
  });
});
