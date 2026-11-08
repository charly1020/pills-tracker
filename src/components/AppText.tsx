import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

import { scaled } from '../domain/textSize';
import { useTextSize } from '../settings/textSize';

const DEFAULT_FONT_SIZE = 14;

/** Multiplies the style's font size by the in-app text size. The phone's own font scale is ignored on purpose, so this setting is the single control. */
function withScale(style: TextProps['style'], scale: number) {
  const flat = StyleSheet.flatten(style) ?? {};
  return [flat, { fontSize: scaled(flat.fontSize ?? DEFAULT_FONT_SIZE, scale) }];
}

export function Text({ style, ...rest }: TextProps) {
  const { scale } = useTextSize();
  return <RNText allowFontScaling={false} style={withScale(style, scale)} {...rest} />;
}

export function TextInput({ style, ...rest }: TextInputProps) {
  const { scale } = useTextSize();
  return <RNTextInput allowFontScaling={false} style={withScale(style, scale)} {...rest} />;
}
