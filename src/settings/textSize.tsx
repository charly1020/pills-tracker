import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSetting, setSetting } from '../db/repository';
import { DEFAULT_TEXT_SIZE, parseTextSize, scaleOf, type TextSize } from '../domain/textSize';

type Value = { size: TextSize; scale: number; setSize: (size: TextSize) => void };

const TextSizeContext = createContext<Value>({ size: DEFAULT_TEXT_SIZE, scale: 1, setSize: () => {} });

export const useTextSize = () => useContext(TextSizeContext);

/** Loads the saved text size before rendering, so the first frame already has the right size. */
export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSizeState] = useState<TextSize | null>(null);

  useEffect(() => {
    getSetting('textSize')
      .then((v) => setSizeState(parseTextSize(v)))
      .catch(() => setSizeState(DEFAULT_TEXT_SIZE));
  }, []);

  const value = useMemo<Value | null>(
    () =>
      size === null
        ? null
        : {
            size,
            scale: scaleOf(size),
            setSize: (next) => {
              setSizeState(next);
              setSetting('textSize', next).catch(() => {});
            },
          },
    [size]
  );

  if (!value) return null;
  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}
