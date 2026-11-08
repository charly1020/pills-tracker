export type Health = { notifications: boolean; exactAlarms: boolean; fullScreen: boolean };
export type Problem = 'notifications' | 'exactAlarms' | 'fullScreen';

export const PROBLEM_TEXT: Record<Problem, string> = {
  notifications: 'Las notificaciones están desactivadas: la alarma no sonará.',
  exactAlarms: 'Las alarmas exactas están desactivadas: la alarma puede retrasarse.',
  fullScreen: 'La pantalla completa está desactivada: la alarma no encenderá la pantalla bloqueada.',
};

/** Most critical first: without notifications nothing rings at all. */
export function problems(h: Health): Problem[] {
  const out: Problem[] = [];
  if (!h.notifications) out.push('notifications');
  if (!h.exactAlarms) out.push('exactAlarms');
  if (!h.fullScreen) out.push('fullScreen');
  return out;
}
