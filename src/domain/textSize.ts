export type TextSize = 'normal' | 'large' | 'xlarge';

export const DEFAULT_TEXT_SIZE: TextSize = 'normal';

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: 'Normal',
  large: 'Grande',
  xlarge: 'Muy grande',
};

const SCALES: Record<TextSize, number> = { normal: 1, large: 1.25, xlarge: 1.5 };

export const scaleOf = (size: TextSize) => SCALES[size];
export const scaled = (base: number, scale: number) => Math.round(base * scale);

export function parseTextSize(value: string | null): TextSize {
  return value === 'normal' || value === 'large' || value === 'xlarge' ? value : DEFAULT_TEXT_SIZE;
}
