import { DEFAULT_TEXT_SIZE, parseTextSize, scaled, scaleOf } from '../textSize';

describe('textSize', () => {
  it('has three increasing scales starting at 1', () => {
    expect(scaleOf('normal')).toBe(1);
    expect(scaleOf('large')).toBeGreaterThan(1);
    expect(scaleOf('xlarge')).toBeGreaterThan(scaleOf('large'));
  });

  it('scales and rounds a base size', () => {
    expect(scaled(20, 1.25)).toBe(25);
    expect(scaled(15, 1.25)).toBe(19);
  });

  it('parses a stored value, falling back to the default for anything unknown', () => {
    expect(parseTextSize('large')).toBe('large');
    expect(parseTextSize('huge')).toBe(DEFAULT_TEXT_SIZE);
    expect(parseTextSize(null)).toBe(DEFAULT_TEXT_SIZE);
  });
});
