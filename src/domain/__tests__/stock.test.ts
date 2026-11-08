import { applyTaken, daysLeft, refill, remainingDoses } from '../stock';

describe('stock', () => {
  it('decreases by units per dose when taken', () => {
    expect(applyTaken(30, 2)).toBe(28);
  });

  it('never goes below zero', () => {
    expect(applyTaken(1, 2)).toBe(0);
    expect(applyTaken(0, 1)).toBe(0);
  });

  it('leaves stock untouched when the dose is text (units 0)', () => {
    expect(applyTaken(30, 0)).toBe(30);
  });

  it('has no days-left estimate when the dose is text', () => {
    expect(daysLeft(30, 0, 3)).toBeNull();
  });

  it('leaves unknown stock (null) untouched', () => {
    expect(applyTaken(null, 1)).toBeNull();
  });

  it('refill adds a box quantity, starting from zero when stock was unknown', () => {
    expect(refill(5, 30)).toBe(35);
    expect(refill(null, 30)).toBe(30);
  });

  it('remainingDoses is stock divided by units per dose, rounded down', () => {
    expect(remainingDoses(7, 2)).toBe(3);
  });

  it('daysLeft uses doses per day, rounded down, null when stock unknown', () => {
    expect(daysLeft(12, 1, 3)).toBe(4);
    expect(daysLeft(11, 1, 3)).toBe(3);
    expect(daysLeft(null, 1, 3)).toBeNull();
    expect(daysLeft(0, 1, 3)).toBe(0);
  });
});
