export const colors = {
  bg: '#ffffff',
  card: '#f2f4f7',
  text: '#101828',
  muted: '#475467',
  primary: '#1d4ed8',
  success: '#1a7f37',
  warning: '#b54708',
  danger: '#b42318',
  border: '#d0d5dd',
};

export const text = {
  title: { fontSize: 32, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 20, color: colors.text },
  small: { fontSize: 18, color: colors.muted },
};
